import prisma from '../utils/prisma';
import { executeWithGeminiFailover, GEMINI_MODEL } from '../utils/ai-client.util';
import { RagRetrieverService } from './ai-rag/rag-retriever.service';
import { RagPromptBuilder, WorkOrderContextInput } from './ai-rag/rag-prompt.builder';
import { RagValidatorService, RawAIPlanResponse, cleanJobName } from './ai-rag/rag-validator.service';

const retriever = new RagRetrieverService();
const promptBuilder = new RagPromptBuilder();
const validator = new RagValidatorService();

export interface ApplyJobItemInput {
  name: string;
  description?: string;
  job_type_id: number;
  estimated_hours: number;
  matched_finding_ids?: number[];
  suggested_part_category_ids?: number[];
  assigned_technician_id?: number | null;
  assigned_technician_name?: string | null;
  assignment_reason?: string | null;
  match_score?: number;
  is_already_exist?: boolean;
  existing_job_id?: number | null;
}

export interface ApplyServiceGroupInput {
  service_id?: number | null;
  service_name: string;
  category_type?: 'REPAIR' | 'MAINTENANCE' | 'OTHER';
  finding_id?: number | null;
  pricing_type?: 'FIXED' | 'LABOUR_PARTS' | 'VEHICLE_SIZE';
  jobs: ApplyJobItemInput[];
}

function cleanServiceName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/^(dịch vụ yêu cầu|dịch vụ|hạng mục|khắc phục lỗi|sửa chữa lỗi|khắc phục|sửa chữa)[\s:\-]+/gi, '')
    .trim();
}

export class AiJobPlannerService {
  /**
   * Sinh danh sách công việc đề xuất bằng kiến trúc RAG
   */
  async generateJobSuggestions(workOrderId: number, targetServiceId?: number) {
    // 1. Truy vấn Work Order và các quan hệ liên quan (bao gồm cả jobs hiện có của các services)
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: true,
        customer: true,
        check_in: true,
        intake_record: {
          include: {
            services: {
              include: {
                service: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        inspections: {
          include: {
            findings: true,
          },
        },
        services: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
            jobs: {
              select: {
                id: true,
                name: true,
                job_type_id: true,
                estimated_hours: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      throw new Error(`Không tìm thấy phiếu công việc với ID: ${workOrderId}`);
    }

    let targetService: any = null;
    if (targetServiceId) {
      targetService = workOrder.services.find((s) => s.id === targetServiceId);
      if (!targetService) {
        throw new Error(`Không tìm thấy hạng mục dịch vụ với ID: ${targetServiceId}`);
      }

      // CHỈ ĐỀ XUẤT CHO HẠNG MỤC Ở TRẠNG THÁI "CHỜ XỬ LÝ" (PENDING)
      if (targetService.status !== 'PENDING') {
        const statusLabel =
          targetService.status === 'IN_PROGRESS'
            ? 'Đang thực hiện'
            : targetService.status === 'COMPLETED'
            ? 'Đã hoàn thành'
            : targetService.status;
        return {
          work_order_id: workOrderId,
          work_order_number: workOrder.wo_number,
          summary: `Hạng mục "${targetService.name}" đang ở trạng thái "${statusLabel}". Hệ thống chỉ đề xuất công việc cho các hạng mục ở trạng thái "Chờ xử lý".`,
          risk_assessment: 'Không áp dụng đề xuất AI cho hạng mục không ở trạng thái Chờ xử lý.',
          suggested_services: [
            {
              service_id: targetService.id,
              service_name: targetService.name,
              is_existing_service: true,
              category_type: 'OTHER',
              finding_id: null,
              finding_info: null,
              jobs: [],
            },
          ],
          suggested_jobs: [],
          available_job_types: [],
          available_technicians: [],
          retrieved_parts_count: 0,
        };
      }
    }

    // Trích xuất các dịch vụ mà khách hàng yêu cầu lúc tiếp nhận
    const requestedServices: Array<{ name: string; category?: string }> = [];
    if (workOrder.intake_record?.services) {
      for (const s of workOrder.intake_record.services) {
        if (s.service?.name) {
          requestedServices.push({
            name: s.service.name,
            category: s.service.category?.name,
          });
        }
      }
    }
    if (workOrder.services) {
      for (const ws of workOrder.services) {
        const svcName = ws.name || ws.service?.name;
        if (svcName && !requestedServices.some((r) => r.name.toLowerCase() === svcName.toLowerCase())) {
          requestedServices.push({
            name: svcName,
            category: ws.service?.category?.name,
          });
        }
      }
    }

    // Trích xuất các dịch vụ hiện có trong Work Order kèm các công việc đã tồn tại và trạng thái
    const existingServices = (workOrder.services || []).map((s) => ({
      id: s.id,
      name: s.name || s.service?.name || 'Dịch vụ',
      category: s.service?.category?.name,
      status: s.status,
      existingJobs: (s.jobs || []).map((j: any) => ({
        id: j.id,
        name: j.name,
      })),
    }));

    // Gom toàn bộ findings của tất cả phiên inspection
    const findings = workOrder.inspections.flatMap((insp) =>
      insp.findings.map((f) => {
        const markerLabel =
          f.marker_type === 'DENT'
            ? 'Móp méo'
            : f.marker_type === 'SCRATCH'
            ? 'Trầy xước'
            : f.marker_type === 'DAMAGE'
            ? 'Hư hỏng bể vỡ'
            : f.marker_type === 'RUST'
            ? 'Rỉ sét'
            : f.marker_type === 'MISSING'
            ? 'Thiếu phụ tùng'
            : f.marker_type || 'Dấu vết hư hại';

        const locationStr = f.part_name ? `tại vị trí ${f.part_name}` : '';
        const descText = f.description?.trim()
          ? f.description
          : `Dấu vết kiểm tra: ${markerLabel} ${locationStr}`.trim();

        return {
          id: f.id,
          marker_type: f.marker_type || 'OTHER',
          part_name: f.part_name || null,
          severity: f.severity,
          description: descText,
          recommendation:
            f.recommendation || `Kiểm tra, phục hồi gò sơn hoặc thay thế tại ${f.part_name || 'bộ phận xe'}`,
        };
      })
    );

    // Chuẩn bị context input kèm danh sách công việc đã có của targetService
    const contextInput: WorkOrderContextInput = {
      workOrderNumber: workOrder.wo_number,
      existingServices,
      requestedServices,
      vehicle: {
        make: workOrder.vehicle.make,
        model: workOrder.vehicle.model,
        year: workOrder.vehicle.year,
        size: workOrder.vehicle.vehicle_size,
        licensePlate: workOrder.vehicle.license_plate,
        mileage: workOrder.check_in?.mileage,
        fuelLevel: workOrder.check_in?.fuel_level,
      },
      customerComplaint: workOrder.check_in?.complaint,
      exteriorCondition: workOrder.check_in?.exterior_condition,
      findings: findings.map((f) => ({
        id: f.id,
        marker_type: f.marker_type,
        severity: f.severity,
        description: f.description,
        recommendation: f.recommendation,
      })),
      targetService: targetService
        ? {
            id: targetService.id,
            name: targetService.name || targetService.service?.name || 'Hạng mục dịch vụ',
            category: targetService.service?.category?.name,
            status: targetService.status,
            existingJobs: (targetService.jobs || []).map((j: any) => ({
              id: j.id,
              name: j.name,
            })),
          }
        : null,
    };

    // 2. Chạy Hybrid RAG Retriever
    const allTexts = [
      ...existingServices.map((s) => `${s.name} ${s.category || ''}`),
      ...requestedServices.map((s) => `${s.name} ${s.category || ''}`),
      contextInput.customerComplaint || '',
      contextInput.exteriorCondition || '',
      ...findings.map((f) => f.description),
      ...findings.map((f) => f.recommendation || ''),
      workOrder.vehicle.make,
      workOrder.vehicle.model,
    ];
    const keywords = retriever.extractKeywords(allTexts);
    const knowledge = await retriever.retrieveKnowledge(keywords);

    // 3. Xây dựng Prompt tổng hợp
    const systemInstruction = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(contextInput, knowledge);

    // 4. Gọi LLM thông qua cơ chế Failover
    const rawResultText = await executeWithGeminiFailover(async (ai, _, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          responseMimeType: 'application/json',
          temperature: 0.1, // Giảm temperature để AI bám sát quy tắc và không bịa thêm việc
        },
      });

      return response.text;
    });

    // 5. Parse JSON
    let parsed: RawAIPlanResponse;
    try {
      parsed = JSON.parse(rawResultText || '{}');
    } catch (e) {
      console.error('Failed to parse Gemini JSON response:', rawResultText);
      throw new Error('AI trả về định dạng phản hồi không hợp lệ');
    }

    // 6. Chạy Post-validation guardrails
    const validJobTypeIds = knowledge.jobTypes.map((jt) => jt.id);
    const validFindingIds = findings.map((f) => f.id);
    const validPartCategoryIds = knowledge.matchingPartCategories.map((p) => p.id);

    const sanitizedPlan = validator.validateAndSanitize(
      parsed,
      validJobTypeIds,
      validFindingIds,
      validPartCategoryIds,
      knowledge.technicians
    );

    // Trích xuất metadata và làm giàu thông tin cho từng Service Group
    const jobTypeMap = new Map(knowledge.jobTypes.map((jt) => [jt.id, jt.name]));
    const findingMap = new Map(findings.map((f) => [f.id, f]));

    const enrichedServices = sanitizedPlan.suggested_services.map((grp) => {
      let matchedServiceId = grp.service_id || null;
      let finalName = grp.service_name;
      let matchedExistingService: any = null;

      // Nếu AI chưa gán service_id, tự động đối soát với existingServices
      if (!matchedServiceId && existingServices.length > 0) {
        const cleanSvcName = cleanServiceName(grp.service_name);
        const found = existingServices.find((es) => {
          const cleanEsName = cleanServiceName(es.name);
          return (
            cleanSvcName === cleanEsName ||
            cleanSvcName.includes(cleanEsName) ||
            cleanEsName.includes(cleanSvcName)
          );
        });
        if (found) {
          matchedServiceId = found.id;
          finalName = found.name;
          matchedExistingService = found;
        }
      } else if (matchedServiceId) {
        matchedExistingService = existingServices.find((es) => es.id === matchedServiceId);
      }

      const existingJobNames = new Set(
        (matchedExistingService?.existingJobs || []).map((j: any) => cleanJobName(j.name))
      );

      const findingInfo = grp.finding_id ? findingMap.get(grp.finding_id) : null;
      const seenGroupJobNames = new Set<string>();
      const deduplicatedGroupJobs: any[] = [];

      for (const job of grp.jobs) {
        const normName = cleanJobName(job.name);
        if (!normName || seenGroupJobNames.has(normName)) continue;
        seenGroupJobNames.add(normName);

        const isAlreadyExist = existingJobNames.has(normName);
        const existingJob = (matchedExistingService?.existingJobs || []).find(
          (j: any) => cleanJobName(j.name) === normName
        );

        deduplicatedGroupJobs.push({
          ...job,
          job_type_name: jobTypeMap.get(job.job_type_id) || 'Công việc kỹ thuật',
          matched_findings: (job.matched_finding_ids || [])
            .map((fid) => findingMap.get(fid))
            .filter(Boolean),
          is_already_exist: isAlreadyExist,
          existing_job_id: existingJob ? existingJob.id : null,
        });
      }

      return {
        service_id: matchedServiceId,
        service_name: finalName,
        is_existing_service: Boolean(matchedServiceId),
        category_type: grp.category_type,
        finding_id: grp.finding_id,
        finding_info: findingInfo
          ? {
              id: findingInfo.id,
              description: findingInfo.description,
              severity: findingInfo.severity,
              marker_type: findingInfo.marker_type,
            }
          : null,
        jobs: deduplicatedGroupJobs,
      };
    });

    const enrichedJobs = sanitizedPlan.suggested_jobs.map((job) => ({
      ...job,
      job_type_name: jobTypeMap.get(job.job_type_id) || 'Công việc kỹ thuật',
      matched_findings: (job.matched_finding_ids || [])
        .map((fid) => findingMap.get(fid))
        .filter(Boolean),
    }));

    let finalServices = enrichedServices;
    let finalJobs = enrichedJobs;
    let finalSummary = sanitizedPlan.summary;

    if (targetServiceId && targetService) {
      // Tìm nhóm khớp nhất với target service
      const matchedGroup = enrichedServices.find(
        (s) => s.service_id === targetServiceId || cleanServiceName(s.service_name) === cleanServiceName(targetService.name)
      );

      // Thu thập jobs từ matchedGroup hoặc từ tất cả groups nếu matchedGroup không có đủ
      const candidateJobs: any[] = [];
      if (matchedGroup && matchedGroup.jobs.length > 0) {
        candidateJobs.push(...matchedGroup.jobs);
      } else {
        enrichedServices.forEach((s) => candidateJobs.push(...s.jobs));
      }

      // Tập hợp các tên job đã tồn tại trong database của targetService
      const existingJobNames = new Set(
        (targetService.jobs || []).map((j: any) => cleanJobName(j.name))
      );

      const seenJobNames = new Set<string>();
      const deduplicatedJobs: any[] = [];

      for (const job of candidateJobs) {
        const normName = cleanJobName(job.name);
        if (!normName) continue;
        if (seenJobNames.has(normName)) continue;
        seenJobNames.add(normName);

        const isAlreadyExist = existingJobNames.has(normName);
        const existingJob = (targetService.jobs || []).find(
          (j: any) => cleanJobName(j.name) === normName
        );

        deduplicatedJobs.push({
          ...job,
          is_already_exist: isAlreadyExist,
          existing_job_id: existingJob ? existingJob.id : null,
        });
      }

      finalServices = [
        {
          service_id: targetService.id,
          service_name: targetService.name || targetService.service?.name || 'Hạng mục dịch vụ',
          is_existing_service: true,
          category_type: matchedGroup?.category_type || (targetService.name.toLowerCase().includes('khắc phục') ? 'REPAIR' : 'OTHER'),
          finding_id: matchedGroup?.finding_id || null,
          finding_info: matchedGroup?.finding_info || null,
          jobs: deduplicatedJobs,
        },
      ];

      finalJobs = deduplicatedJobs;
      finalSummary = deduplicatedJobs.length === 0
        ? (parsed.summary || `Các công việc hiện tại của hạng mục "${targetService.name}" đã phù hợp và đầy đủ quy trình kỹ thuật, không cần bổ sung thêm.`)
        : (parsed.summary || `Đề xuất các bước kỹ thuật bổ sung cho riêng hạng mục: "${targetService.name}"`);
    } else {
      // Khi đề xuất tổng thể toàn phiếu: CHỈ GIỮ LẠI các hạng mục đang ở trạng thái PENDING hoặc dịch vụ mới cho Finding
      finalServices = enrichedServices.filter((s) => {
        if (!s.service_id) return true; // Dịch vụ mới đề xuất cho finding chưa giải quyết
        const matchWoSvc = workOrder.services.find((ws) => ws.id === s.service_id);
        return !matchWoSvc || matchWoSvc.status === 'PENDING';
      });
      finalJobs = finalServices.flatMap((s) => s.jobs);
    }

    return {
      work_order_id: workOrderId,
      work_order_number: workOrder.wo_number,
      summary: finalSummary,
      risk_assessment: sanitizedPlan.risk_assessment,
      suggested_services: finalServices,
      suggested_jobs: finalJobs,
      available_job_types: knowledge.jobTypes,
      available_technicians: knowledge.technicians,
      retrieved_parts_count: knowledge.matchingPartCategories.length,
    };
  }

  /**
   * Áp dụng các Hạng mục & Job được SA tuyển chọn vào Database (Prisma Transaction)
   */
  async applyJobs(
    workOrderId: number,
    advisorUserId: number,
    payload: ApplyServiceGroupInput[] | ApplyJobItemInput[]
  ) {
    if (!payload || !Array.isArray(payload) || payload.length === 0) {
      throw new Error('Danh sách công việc hoặc hạng mục áp dụng không được để trống');
    }

    // Chuẩn hóa payload thành danh sách Hạng mục (Service Groups)
    let serviceGroups: ApplyServiceGroupInput[] = [];

    // Kiểm tra xem payload là dạng nhóm ApplyServiceGroupInput hay dạng phẳng ApplyJobItemInput
    if ('jobs' in payload[0] && Array.isArray((payload[0] as any).jobs)) {
      serviceGroups = payload as ApplyServiceGroupInput[];
    } else {
      // Dạng phẳng cũ: Nhóm theo finding hoặc gom chung
      const flatJobs = payload as ApplyJobItemInput[];
      const groups = new Map<number | 'OTHER', ApplyJobItemInput[]>();

      for (const job of flatJobs) {
        const fid = job.matched_finding_ids && job.matched_finding_ids.length > 0
          ? job.matched_finding_ids[0]
          : 'OTHER';
        if (!groups.has(fid)) groups.set(fid, []);
        groups.get(fid)!.push(job);
      }

      serviceGroups = Array.from(groups.entries()).map(([fid, jobs]) => {
        if (typeof fid === 'number') {
          return {
            service_name: `Khắc phục lỗi #${fid}`,
            category_type: 'REPAIR' as const,
            finding_id: fid,
            pricing_type: 'LABOUR_PARTS' as const,
            jobs,
          };
        } else {
          return {
            service_name: 'Dịch vụ kỹ thuật & bảo dưỡng',
            category_type: 'OTHER' as const,
            finding_id: null,
            pricing_type: 'LABOUR_PARTS' as const,
            jobs,
          };
        }
      });
    }

    return await prisma.$transaction(async (tx) => {
      // Đếm số lượng woService hiện tại để tính sort_order
      const existingCount = await tx.woService.count({
        where: { work_order_id: workOrderId },
      });
      let nextSortOrder = existingCount + 1;

      const jobTypes = await tx.jobType.findMany();
      const jobTypeMap = new Map(jobTypes.map((jt) => [jt.id, jt]));

      let totalAppliedJobs = 0;
      let totalCreatedServices = 0;

      for (const group of serviceGroups) {
        if (!group.jobs || group.jobs.length === 0) continue;

        // 1. Tìm hoặc tạo Hạng mục dịch vụ (WoService)
        let woService = null;

        // Cách 1: Tìm theo ID chính xác nếu payload có service_id
        if (group.service_id) {
          woService = await tx.woService.findFirst({
            where: {
              id: group.service_id,
              work_order_id: workOrderId,
            },
          });
        }

        // Cách 2: Tìm theo tên chính xác
        if (!woService) {
          woService = await tx.woService.findFirst({
            where: {
              work_order_id: workOrderId,
              name: group.service_name,
            },
          });
        }

        // Cách 3: Tìm mờ theo tên chuẩn hóa (loại bỏ tiền tố như "Dịch vụ yêu cầu:", "Khắc phục lỗi:", v.v.)
        if (!woService) {
          const existingWOServices = await tx.woService.findMany({
            where: { work_order_id: workOrderId },
          });
          const cleanGroupName = cleanServiceName(group.service_name);
          for (const existing of existingWOServices) {
            const cleanExistName = cleanServiceName(existing.name);
            if (
              cleanGroupName === cleanExistName ||
              cleanGroupName.includes(cleanExistName) ||
              cleanExistName.includes(cleanGroupName)
            ) {
              woService = existing;
              break;
            }
          }
        }

        // Chỉ tạo mới NẾU THỰC SỰ không khớp với bất kỳ dịch vụ nào hiện có trong Work Order!
        if (!woService) {
          woService = await tx.woService.create({
            data: {
              work_order_id: workOrderId,
              name: group.service_name,
              pricing_type: group.pricing_type || (group.category_type === 'OTHER' ? 'FIXED' : 'LABOUR_PARTS'),
              status: 'PENDING',
              sort_order: nextSortOrder++,
            },
          });
          totalCreatedServices++;
        }

        // 2. Lấy danh sách các jobs hiện có trong woService để chống trùng lặp / chồng job
        const currentJobs = await tx.job.findMany({
          where: { wo_service_id: woService.id },
          select: { id: true, name: true, job_type_id: true },
        });

        const currentJobNamesSet = new Set(
          currentJobs.map((j) => cleanJobName(j.name))
        );

        // 3. Tạo các công việc con (Job) thuộc về hạng mục này (bỏ qua nếu đã tồn tại)
        for (const jobItem of group.jobs) {
          const normName = cleanJobName(jobItem.name);
          if (!normName) continue;

          // BỎ QUA nếu job đã tồn tại trong hạng mục này
          if (currentJobNamesSet.has(normName)) {
            console.log(`[AI Apply Guardrail] Bỏ qua công việc trùng lặp: "${jobItem.name}" đã tồn tại trong hạng mục "${woService.name}".`);
            continue;
          }

          // Đánh dấu đã thêm để không bị trùng lặp ngay trong payload
          currentJobNamesSet.add(normName);

          const jt = jobTypeMap.get(jobItem.job_type_id);
          const hours = Number(jobItem.estimated_hours) || 1.0;

          const newJob = await tx.job.create({
            data: {
              wo_service_id: woService.id,
              job_type_id: jobItem.job_type_id,
              name: jobItem.name,
              description: jobItem.description || null,
              estimated_hours: hours,
              status: 'PLANNED',
              created_by_id: advisorUserId,
            },
          });

          // Tạo JobLabour kèm phân công KTV (tự động từ AI hoặc do SA chọn)
          await tx.jobLabour.create({
            data: {
              job_id: newJob.id,
              job_type_id: jobItem.job_type_id,
              employee_id: jobItem.assigned_technician_id || null,
              description: jobItem.name,
              estimated_hours: hours,
              price: hours * 150000,
            },
          });

          // Liên kết Findings
          const targetFindingIds = new Set<number>();
          if (group.finding_id) {
            targetFindingIds.add(group.finding_id);
          }
          if (Array.isArray(jobItem.matched_finding_ids)) {
            jobItem.matched_finding_ids.forEach((id) => targetFindingIds.add(id));
          }

          for (const findingId of targetFindingIds) {
            await tx.jobFinding.create({
              data: {
                job_id: newJob.id,
                finding_id: findingId,
              },
            });

            await tx.finding.update({
              where: { id: findingId },
              data: { status: 'LINKED_TO_JOB' },
            });
          }

          totalAppliedJobs++;
        }
      }

      return {
        success: true,
        message: `Đã áp dụng thành công ${totalAppliedJobs} công việc thuộc ${serviceGroups.length} hạng mục vào phiếu`,
        applied_jobs_count: totalAppliedJobs,
        created_services_count: totalCreatedServices,
      };
    });
  }
}
