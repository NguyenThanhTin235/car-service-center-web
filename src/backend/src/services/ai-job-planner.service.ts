import prisma from '../utils/prisma';
import logger from '../loggers/logger';
import { executeWithGeminiFailover, GeminiFailoverAttemptMeta } from '../utils/ai-client.util';
import { getCache, setCache } from '../utils/redis.util';
import { scoreViTextMatch, stripJsonCodeFence, stripViAccents } from '../utils/vi-text.util';
import {
  createAiTraceId,
  estimateGeminiCostUsd,
  recordAiTelemetry,
} from '../utils/ai-telemetry.util';
import { notificationService } from './notification.service';
import { RagRetrieverService, RetrievedKnowledge } from './ai-rag/rag-retriever.service';
import { RagPromptBuilder, WorkOrderContextInput } from './ai-rag/rag-prompt.builder';
import {
  RagValidatorService,
  RawAIPlanResponse,
  RawAIServiceGroup,
  cleanJobName,
} from './ai-rag/rag-validator.service';

export class AiDomainError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AiDomainError';
  }
}

const retriever = new RagRetrieverService();
const promptBuilder = new RagPromptBuilder();
const validator = new RagValidatorService();

const JOB_PLAN_CACHE_TTL_SECONDS = 30;
const inFlightJobPlans = new Map<string, Promise<any>>();

const LOCKED_WO_STATUSES = new Set([
  'BILLING_REQUESTED',
  'FINANCIAL_CLEARED',
  'RELEASED',
  'CLOSED',
  'CANCELLED',
]);

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
  return stripViAccents(name)
    .replace(
      /^(dich vu yeu cau|dich vu|hang muc|khac phuc loi|sua chua loi|khac phuc|sua chua)[\s:\-]+/gi,
      ''
    )
    .trim();
}

function buildDeterministicFallbackPlan(
  contextInput: WorkOrderContextInput,
  knowledge: RetrievedKnowledge,
  targetService?: any
): RawAIPlanResponse {
  const defaultJobTypeId = knowledge.jobTypes[0]?.id || 1;
  const groups: RawAIServiceGroup[] = [];

  const servicesToPlan = targetService
    ? [
        {
          id: targetService.id,
          name: targetService.name || targetService.service?.name || 'Hạng mục dịch vụ',
          category: targetService.service?.category?.name,
          status: targetService.status,
          existingJobs: (targetService.jobs || []).map((j: any) => ({ id: j.id, name: j.name })),
        },
      ]
    : (contextInput.existingServices || []).filter((s) => s.status === 'PENDING');

  for (const svc of servicesToPlan) {
    const existingSet = new Set((svc.existingJobs || []).map((j: { name: string }) => cleanJobName(j.name)));
    const matchingTemplates = knowledge.jobTemplates
      .filter((jt) => {
        const sMatch = jt.service_name && cleanServiceName(jt.service_name) === cleanServiceName(svc.name);
        const textScore = scoreViTextMatch([svc.name, svc.category || ''], jt.name);
        return Boolean(sMatch) || textScore >= 6;
      })
      .slice(0, 3);

    const jobs = matchingTemplates
      .filter((jt) => !existingSet.has(cleanJobName(jt.name)))
      .map((jt) => ({
        name: jt.name,
        description: `Thực hiện theo quy chuẩn kỹ thuật xưởng cho "${svc.name}".`,
        job_type_id: jt.job_type_id || defaultJobTypeId,
        estimated_hours: jt.estimated_hours || 1.0,
        severity: 'MEDIUM' as const,
      }));

    if (jobs.length === 0 && existingSet.size === 0) {
      jobs.push({
        name: `Kiểm tra & xử lý ${svc.name}`,
        description: `Kiểm tra kỹ thuật và thực hiện hạng mục ${svc.name}.`,
        job_type_id: defaultJobTypeId,
        estimated_hours: 1.0,
        severity: 'MEDIUM',
      });
    }

    groups.push({
      service_id: svc.id,
      service_name: svc.name,
      category_type: 'OTHER',
      finding_id: null,
      jobs,
    });
  }

  if (!targetService && contextInput.findings.length > 0) {
    for (const f of contextInput.findings) {
      groups.push({
        service_id: null,
        service_name: `Khắc phục lỗi: ${f.part_name || f.marker_type}`,
        category_type: 'REPAIR',
        finding_id: f.id,
        jobs: [
          {
            name: `Kiểm tra & khắc phục ${f.part_name || 'lỗi'} (#${f.id})`,
            description: f.recommendation || f.description,
            job_type_id: defaultJobTypeId,
            estimated_hours: 1.0,
            severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(f.severity)
              ? f.severity
              : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            matched_finding_ids: [f.id],
          },
        ],
      });
    }
  }

  return {
    summary:
      'Hệ thống AI tạm thời quá tải — đã tự động lập đề xuất quy trình từ định mức chuẩn & mẫu công việc của xưởng.',
    risk_assessment: 'Cố vấn dịch vụ vui lòng rà soát lại định mức giờ công và phụ tùng trước khi áp dụng.',
    suggested_services: groups,
  };
}

export class AiJobPlannerService {
  /**
   * Sinh danh sách công việc đề xuất bằng kiến trúc Hybrid RAG + Singleflight + Deterministic Fallback.
   */
  async generateJobSuggestions(workOrderId: number, targetServiceId?: number, traceId?: string) {
    const reqTraceId = createAiTraceId(traceId);
    const totalStart = performance.now();
    const dedupKey = `${workOrderId}:${targetServiceId ?? 'all'}`;

    const existingInFlight = inFlightJobPlans.get(dedupKey);
    if (existingInFlight) {
      const result = await existingInFlight;
      recordAiTelemetry({
        traceId: reqTraceId,
        workflow: 'job_planner',
        promptVersion: 'v2.0',
        totalMs: performance.now() - totalStart,
        dedupHit: true,
        isFallback: Boolean(result?.is_fallback),
      });
      return result;
    }

    const workPromise = this._generateJobSuggestionsInternal(
      workOrderId,
      targetServiceId,
      reqTraceId,
      totalStart
    ).finally(() => {
      inFlightJobPlans.delete(dedupKey);
    });

    inFlightJobPlans.set(dedupKey, workPromise);
    return workPromise;
  }

  private async _generateJobSuggestionsInternal(
    workOrderId: number,
    targetServiceId: number | undefined,
    traceId: string,
    totalStart: number
  ) {
    const retrievalStart = performance.now();

    // 1. Truy vấn Work Order (không nạp User PII/password_hash)
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        vehicle: true,
        check_in: true,
        intake_record: {
          include: {
            services: {
              include: {
                service: { include: { category: true } },
              },
            },
          },
        },
        inspections: {
          include: { findings: true },
        },
        services: {
          include: {
            service: { include: { category: true } },
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
      throw new AiDomainError(404, 'WORK_ORDER_NOT_FOUND', `Không tìm thấy phiếu công việc với ID: ${workOrderId}`);
    }

    let targetService: any = null;
    if (targetServiceId) {
      targetService = workOrder.services.find((s) => s.id === targetServiceId);
      if (!targetService) {
        throw new AiDomainError(
          404,
          'WO_SERVICE_NOT_FOUND',
          `Không tìm thấy hạng mục dịch vụ với ID: ${targetServiceId}`
        );
      }

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
          is_fallback: false,
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

    const totalJobsCount = workOrder.services.reduce((acc, s) => acc + (s.jobs?.length || 0), 0);
    const totalFindingsCount = workOrder.inspections.reduce((acc, i) => acc + (i.findings?.length || 0), 0);
    const cacheKey = `ai_job_plan:v2:${workOrderId}:${targetServiceId ?? 'all'}:${workOrder.updated_at.getTime()}:${workOrder.services.length}:${totalJobsCount}:${totalFindingsCount}`;

    if (process.env.NODE_ENV !== 'test') {
      try {
        const cached = await getCache(cacheKey);
        if (cached) {
          const parsedCached = JSON.parse(cached);
          recordAiTelemetry({
            traceId,
            workflow: 'job_planner',
            promptVersion: 'v2.0',
            retrievalMs: Math.round((performance.now() - retrievalStart) * 10) / 10,
            totalMs: Math.round((performance.now() - totalStart) * 10) / 10,
            cacheHit: true,
            isFallback: false,
          });
          return parsedCached;
        }
      } catch {
        // Ignore cache read error
      }
    }

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

    const contextInput: WorkOrderContextInput = {
      workOrderNumber: workOrder.wo_number,
      existingServices,
      requestedServices,
      vehicle: {
        make: workOrder.vehicle.make,
        model: workOrder.vehicle.model,
        year: workOrder.vehicle.year,
        size: workOrder.vehicle.vehicle_size,
        mileage: workOrder.check_in?.mileage,
        fuelLevel: workOrder.check_in?.fuel_level,
      },
      customerComplaint: workOrder.check_in?.complaint,
      exteriorCondition: workOrder.check_in?.exterior_condition,
      findings: findings.map((f) => ({
        id: f.id,
        marker_type: f.marker_type,
        part_name: f.part_name,
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

    const allTexts = targetService
      ? [
          targetService.name || '',
          targetService.service?.category?.name || '',
          contextInput.customerComplaint || '',
          ...findings.map((f) => `${f.part_name || ''} ${f.description} ${f.recommendation || ''}`),
        ]
      : [
          ...existingServices.map((s) => `${s.name} ${s.category || ''}`),
          ...requestedServices.map((s) => `${s.name} ${s.category || ''}`),
          contextInput.customerComplaint || '',
          contextInput.exteriorCondition || '',
          ...findings.map((f) => `${f.part_name || ''} ${f.description} ${f.recommendation || ''}`),
          workOrder.vehicle.make,
          workOrder.vehicle.model,
        ];

    const keywords = retriever.extractKeywords(allTexts);
    const knowledge = await retriever.retrieveKnowledge(keywords, {
      make: workOrder.vehicle.make,
      model: workOrder.vehicle.model,
      size: workOrder.vehicle.vehicle_size,
      rawTexts: allTexts,
    });
    const retrievalMs = Math.round((performance.now() - retrievalStart) * 10) / 10;

    const systemInstruction = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(contextInput, knowledge);

    let parsed: RawAIPlanResponse;
    let isFallback = false;
    let attemptMeta: GeminiFailoverAttemptMeta | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    const llmStart = performance.now();
    try {
      const llmOutput = await executeWithGeminiFailover(
        async (ai, _, model, abortSignal) => {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              responseMimeType: 'application/json',
              temperature: 0.1,
              ...(abortSignal ? { abortSignal } : {}),
            },
          });

          return {
            text: response.text || '',
            usage: response.usageMetadata,
          };
        },
        12000,
        {
          onAttemptMeta: (meta) => {
            attemptMeta = meta;
          },
        }
      );

      const rawText = typeof llmOutput === 'string' ? llmOutput : llmOutput.text;
      if (typeof llmOutput !== 'string' && llmOutput.usage) {
        inputTokens = llmOutput.usage.promptTokenCount || 0;
        outputTokens = llmOutput.usage.candidatesTokenCount || 0;
      }

      const cleanedJson = stripJsonCodeFence(rawText);
      const parsedObj = JSON.parse(cleanedJson || '{}');
      if (!parsedObj || typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
        throw new Error('AI response is not a valid JSON object');
      }
      parsed = parsedObj as RawAIPlanResponse;
    } catch (err) {
      logger.warn('[AiJobPlannerService] Gemini unavailable or invalid JSON, activating deterministic RAG fallback', {
        traceId,
        workOrderId,
        error: (err as Error).message.slice(0, 160),
      });
      isFallback = true;
      parsed = buildDeterministicFallbackPlan(contextInput, knowledge, targetService);
    }
    const llmMs = Math.round((performance.now() - llmStart) * 10) / 10;

    const validationStart = performance.now();
    const interventions: string[] = [];
    const validJobTypeIds = knowledge.jobTypes.map((jt) => jt.id);
    const validFindingIds = findings.map((f) => f.id);
    const validPartCategoryIds = knowledge.matchingPartCategories.map((p) => p.id);

    const sanitizedPlan = validator.validateAndSanitize(
      parsed,
      validJobTypeIds,
      validFindingIds,
      validPartCategoryIds,
      knowledge.technicians,
      (reason) => interventions.push(reason)
    );

    const jobTypeMap = new Map(knowledge.jobTypes.map((jt) => [jt.id, jt.name]));
    const findingMap = new Map(findings.map((f) => [f.id, f]));

    const enrichedServices = sanitizedPlan.suggested_services.map((grp) => {
      let matchedServiceId = grp.service_id || null;
      let finalName = grp.service_name;
      let matchedExistingService: any = null;

      if (!matchedServiceId && existingServices.length > 0) {
        const cleanSvcName = cleanServiceName(grp.service_name);
        if (cleanSvcName.length >= 4) {
          const found = existingServices.find((es) => {
            const cleanEsName = cleanServiceName(es.name);
            return (
              cleanEsName.length >= 4 &&
              (cleanSvcName === cleanEsName ||
                cleanSvcName.includes(cleanEsName) ||
                cleanEsName.includes(cleanSvcName))
            );
          });
          if (found) {
            matchedServiceId = found.id;
            finalName = found.name;
            matchedExistingService = found;
          }
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
      const matchedGroup = enrichedServices.find(
        (s) =>
          s.service_id === targetServiceId ||
          (cleanServiceName(s.service_name).length >= 4 &&
            cleanServiceName(s.service_name) === cleanServiceName(targetService.name))
      );

      const candidateJobs: any[] = [];
      if (matchedGroup) {
        // Respect empty jobs array when AI determines existing jobs are already complete
        candidateJobs.push(...matchedGroup.jobs);
      } else if (enrichedServices.length === 1 && !enrichedServices[0].service_id) {
        candidateJobs.push(...enrichedServices[0].jobs);
      }

      const existingJobNames = new Set(
        (targetService.jobs || []).map((j: any) => cleanJobName(j.name))
      );
      const seenJobNames = new Set<string>();
      const deduplicatedJobs: any[] = [];

      for (const job of candidateJobs) {
        const normName = cleanJobName(job.name);
        if (!normName || seenJobNames.has(normName)) continue;
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
          category_type:
            matchedGroup?.category_type ||
            (targetService.name.toLowerCase().includes('khắc phục') ? 'REPAIR' : 'OTHER'),
          finding_id: matchedGroup?.finding_id || null,
          finding_info: matchedGroup?.finding_info || null,
          jobs: deduplicatedJobs,
        },
      ];

      finalJobs = deduplicatedJobs;
      finalSummary =
        deduplicatedJobs.length === 0
          ? parsed.summary ||
            `Các công việc hiện tại của hạng mục "${targetService.name}" đã phù hợp và đầy đủ quy trình kỹ thuật, không cần bổ sung thêm.`
          : parsed.summary || `Đề xuất các bước kỹ thuật bổ sung cho riêng hạng mục: "${targetService.name}"`;
    } else {
      finalServices = enrichedServices.filter((s) => {
        if (!s.service_id) return true;
        const matchWoSvc = workOrder.services.find((ws) => ws.id === s.service_id);
        return !matchWoSvc || matchWoSvc.status === 'PENDING';
      });
      finalJobs = finalServices.flatMap((s) => s.jobs);
    }

    const validationMs = Math.round((performance.now() - validationStart) * 10) / 10;
    const totalMs = Math.round((performance.now() - totalStart) * 10) / 10;

    const responsePayload = {
      work_order_id: workOrderId,
      work_order_number: workOrder.wo_number,
      is_fallback: isFallback,
      summary: finalSummary,
      risk_assessment: sanitizedPlan.risk_assessment,
      suggested_services: finalServices,
      suggested_jobs: finalJobs,
      available_job_types: knowledge.jobTypes,
      available_technicians: knowledge.technicians,
      retrieved_parts_count: knowledge.matchingPartCategories.length,
    };

    if (!isFallback && process.env.NODE_ENV !== 'test') {
      void setCache(cacheKey, JSON.stringify(responsePayload), JOB_PLAN_CACHE_TTL_SECONDS).catch(
        () => {}
      );
    }

    recordAiTelemetry({
      traceId,
      workflow: 'job_planner',
      promptVersion: 'v2.0',
      provider: isFallback ? 'deterministic_fallback' : 'google_gemini',
      model: attemptMeta?.model,
      inputTokens,
      outputTokens,
      estimatedCostUsd: estimateGeminiCostUsd(attemptMeta?.model, inputTokens, outputTokens),
      retrievalMs,
      llmMs,
      validationMs,
      totalMs,
      cacheHit: false,
      retryCount: attemptMeta ? Math.max(0, attemptMeta.attempts - 1) : 0,
      isFallback,
      guardrailInterventions: interventions.length > 0 ? interventions : undefined,
    });

    return responsePayload;
  }

  /**
   * Áp dụng các Hạng mục & Job được SA tuyển chọn vào Database (Prisma Transaction + Full Guardrails)
   */
  async applyJobs(
    workOrderId: number,
    advisorUserId: number,
    payload: ApplyServiceGroupInput[] | ApplyJobItemInput[]
  ) {
    if (!payload || !Array.isArray(payload) || payload.length === 0) {
      throw new AiDomainError(
        400,
        'VALIDATION_ERROR',
        'Danh sách công việc hoặc hạng mục áp dụng không được để trống'
      );
    }

    let serviceGroups: ApplyServiceGroupInput[] = [];
    if ('jobs' in payload[0] && Array.isArray((payload[0] as any).jobs)) {
      serviceGroups = payload as ApplyServiceGroupInput[];
    } else {
      const flatJobs = payload as ApplyJobItemInput[];
      const groups = new Map<number | 'OTHER', ApplyJobItemInput[]>();

      for (const job of flatJobs) {
        const fid =
          job.matched_finding_ids && job.matched_finding_ids.length > 0
            ? job.matched_finding_ids[0]
            : 'OTHER';
        if (!groups.has(fid)) groups.set(fid, []);
        groups.get(fid)!.push(job);
      }

      serviceGroups = Array.from(groups.entries()).map(([fid, jobs]) =>
        typeof fid === 'number'
          ? {
              service_name: `Khắc phục lỗi #${fid}`,
              category_type: 'REPAIR' as const,
              finding_id: fid,
              pricing_type: 'LABOUR_PARTS' as const,
              jobs,
            }
          : {
              service_name: 'Dịch vụ kỹ thuật & bảo dưỡng',
              category_type: 'OTHER' as const,
              finding_id: null,
              pricing_type: 'LABOUR_PARTS' as const,
              jobs,
            }
      );
    }

    // Strict DTO bounds check before transaction
    if (serviceGroups.length > 20) {
      throw new AiDomainError(400, 'VALIDATION_ERROR', 'Tối đa 20 hạng mục dịch vụ cho mỗi lần áp dụng');
    }

    let totalRequestedJobs = 0;
    const requestedTechIds = new Set<number>();

    for (const grp of serviceGroups) {
      if (!grp || typeof grp.service_name !== 'string' || grp.service_name.trim().length === 0) {
        throw new AiDomainError(400, 'VALIDATION_ERROR', 'Tên hạng mục dịch vụ không được để trống');
      }
      if (!Array.isArray(grp.jobs)) {
        throw new AiDomainError(400, 'VALIDATION_ERROR', 'Danh sách công việc trong hạng mục không hợp lệ');
      }
      totalRequestedJobs += grp.jobs.length;
      if (totalRequestedJobs > 50) {
        throw new AiDomainError(400, 'VALIDATION_ERROR', 'Tổng số công việc áp dụng mỗi lần không được vượt quá 50');
      }

      for (const j of grp.jobs) {
        if (!j || typeof j.name !== 'string' || j.name.trim().length === 0 || j.name.trim().length > 255) {
          throw new AiDomainError(400, 'VALIDATION_ERROR', 'Tên công việc phải từ 1 đến 255 ký tự');
        }
        const hours = Number(j.estimated_hours);
        if (!Number.isFinite(hours) || hours < 0.1 || hours > 24) {
          throw new AiDomainError(
            400,
            'VALIDATION_ERROR',
            `Giờ công ước tính của "${j.name.trim()}" phải nằm trong khoảng 0.1 đến 24 giờ`
          );
        }
        if (j.assigned_technician_id !== undefined && j.assigned_technician_id !== null) {
          const techId = Number(j.assigned_technician_id);
          if (!Number.isInteger(techId) || techId <= 0) {
            throw new AiDomainError(400, 'INVALID_TECHNICIAN', 'Mã kỹ thuật viên không hợp lệ');
          }
          requestedTechIds.add(techId);
        }
      }
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          services: true,
          inspections: {
            select: {
              findings: { select: { id: true } },
            },
          },
        },
      });

      if (!workOrder) {
        throw new AiDomainError(404, 'WORK_ORDER_NOT_FOUND', `Không tìm thấy phiếu công việc với ID: ${workOrderId}`);
      }

      if (LOCKED_WO_STATUSES.has(workOrder.status)) {
        throw new AiDomainError(
          409,
          'WORK_ORDER_LOCKED',
          `Phiếu công việc đang ở trạng thái ${workOrder.status}, không thể áp dụng thêm công việc.`
        );
      }

      const validWoFindingIds = new Set<number>(
        workOrder.inspections.flatMap((insp) => insp.findings.map((f) => f.id))
      );

      // Verify all finding IDs belong strictly to THIS WorkOrder (Anti-IDOR)
      for (const group of serviceGroups) {
        if (group.finding_id && !validWoFindingIds.has(Number(group.finding_id))) {
          throw new AiDomainError(
            400,
            'INVALID_FINDING_OWNERSHIP',
            `Lỗi phát hiện #${group.finding_id} không thuộc phiếu công việc #${workOrder.wo_number}`
          );
        }
        for (const jobItem of group.jobs) {
          if (Array.isArray(jobItem.matched_finding_ids)) {
            for (const fid of jobItem.matched_finding_ids) {
              if (!validWoFindingIds.has(Number(fid))) {
                throw new AiDomainError(
                  400,
                  'INVALID_FINDING_OWNERSHIP',
                  `Lỗi phát hiện #${fid} không thuộc phiếu công việc #${workOrder.wo_number}`
                );
              }
            }
          }
        }
      }

      const [jobTypes, jobTemplates, catalogServices, validTechEmployees] = await Promise.all([
        tx.jobType.findMany({ where: { is_active: true } }),
        tx.jobTemplate.findMany({ select: { id: true, name: true, price: true } }),
        tx.service.findMany({
          where: { is_active: true },
          select: { id: true, name: true, pricing_type: true, warranty_months: true },
        }),
        requestedTechIds.size > 0
          ? tx.employee.findMany({
              where: {
                id: { in: Array.from(requestedTechIds) },
                is_active: true,
                position: { in: ['TECHNICIAN', 'DETAILER'] },
              },
              select: { id: true, user_id: true, full_name: true },
            })
          : Promise.resolve([]),
      ]);

      const jobTypeMap = new Map(jobTypes.map((jt) => [jt.id, jt]));
      const jobTemplateMap = new Map(jobTemplates.map((tpl) => [cleanJobName(tpl.name), tpl]));
      const catalogServiceMap = new Map(
        catalogServices.map((cs) => [cleanServiceName(cs.name), cs])
      );
      const validTechMap = new Map(validTechEmployees.map((e) => [e.id, e]));

      // Validate job_type_id & assigned_technician_id upfront
      for (const group of serviceGroups) {
        for (const jobItem of group.jobs) {
          if (!jobTypeMap.has(Number(jobItem.job_type_id))) {
            throw new AiDomainError(
              400,
              'INVALID_JOB_TYPE',
              `Loại công việc (job_type_id=${jobItem.job_type_id}) không tồn tại hoặc đã ngừng sử dụng.`
            );
          }
          if (jobItem.assigned_technician_id != null && !validTechMap.has(Number(jobItem.assigned_technician_id))) {
            throw new AiDomainError(
              400,
              'INVALID_TECHNICIAN',
              `Kỹ thuật viên ID #${jobItem.assigned_technician_id} không tồn tại hoặc đã ngừng hoạt động.`
            );
          }
        }
      }

      let nextSortOrder =
        workOrder.services.reduce((max, s) => Math.max(max, s.sort_order || 0), 0) + 1;
      const woServicesCache = [...workOrder.services];

      let totalAppliedJobs = 0;
      let totalCreatedServices = 0;
      const assignedNotifications: Array<{ userId: number; jobName: string }> = [];

      for (const group of serviceGroups) {
        if (!group.jobs || group.jobs.length === 0) continue;

        let woService = null;

        if (group.service_id) {
          woService = woServicesCache.find((s) => s.id === Number(group.service_id)) || null;
        }
        if (!woService) {
          woService =
            woServicesCache.find(
              (s) => s.name.trim().toLowerCase() === group.service_name.trim().toLowerCase()
            ) || null;
        }
        if (!woService) {
          const cleanGroupName = cleanServiceName(group.service_name);
          if (cleanGroupName.length >= 4) {
            woService =
              woServicesCache.find((existing) => {
                const cleanExistName = cleanServiceName(existing.name);
                return (
                  cleanExistName.length >= 4 &&
                  (cleanGroupName === cleanExistName ||
                    cleanGroupName.includes(cleanExistName) ||
                    cleanExistName.includes(cleanGroupName))
                );
              }) || null;
          }
        }

        if (woService && woService.status !== 'PENDING') {
          throw new AiDomainError(
            409,
            'SERVICE_NOT_PENDING',
            `Hạng mục "${woService.name}" đang ở trạng thái ${woService.status}, chỉ cho phép áp dụng vào hạng mục Chờ xử lý.`
          );
        }

        if (!woService) {
          const cleanGrp = cleanServiceName(group.service_name);
          const matchedCatalog = cleanGrp.length >= 4 ? catalogServiceMap.get(cleanGrp) : undefined;
          // Ad-hoc AI services without a catalog service_id MUST use LABOUR_PARTS (never 0đ FIXED)
          const resolvedPricingType = matchedCatalog
            ? matchedCatalog.pricing_type
            : group.pricing_type === 'FIXED' || !group.pricing_type
              ? 'LABOUR_PARTS'
              : group.pricing_type;

          woService = await tx.woService.create({
            data: {
              work_order_id: workOrderId,
              service_id: matchedCatalog?.id ?? null,
              name: group.service_name.trim().slice(0, 255),
              pricing_type: resolvedPricingType,
              status: 'PENDING',
              sort_order: nextSortOrder++,
              warranty_months: matchedCatalog?.warranty_months ?? 0,
            },
          });
          woServicesCache.push(woService);
          totalCreatedServices++;
        }

        const currentJobs = await tx.job.findMany({
          where: { wo_service_id: woService.id },
          select: { id: true, name: true },
        });
        const currentJobNamesSet = new Set(currentJobs.map((j) => cleanJobName(j.name)));

        for (const jobItem of group.jobs) {
          const normName = cleanJobName(jobItem.name);
          if (!normName || currentJobNamesSet.has(normName)) {
            continue;
          }
          currentJobNamesSet.add(normName);

          const hours = Math.round(Number(jobItem.estimated_hours) * 10) / 10;
          const matchedTemplate = jobTemplateMap.get(normName);
          const labourPrice =
            matchedTemplate && Number(matchedTemplate.price) > 0
              ? Number(matchedTemplate.price)
              : Math.round(hours * 150000);

          const newJob = await tx.job.create({
            data: {
              wo_service_id: woService.id,
              job_type_id: Number(jobItem.job_type_id),
              job_template_id: matchedTemplate?.id ?? null,
              name: jobItem.name.trim().slice(0, 255),
              description: jobItem.description ? String(jobItem.description).trim().slice(0, 1000) : null,
              estimated_hours: hours,
              status: 'PLANNED',
              created_by_id: advisorUserId,
            },
          });

          const techId = jobItem.assigned_technician_id ? Number(jobItem.assigned_technician_id) : null;
          await tx.jobLabour.create({
            data: {
              job_id: newJob.id,
              job_type_id: Number(jobItem.job_type_id),
              employee_id: techId,
              description: jobItem.name.trim().slice(0, 255),
              estimated_hours: hours,
              price: labourPrice,
            },
          });

          if (techId) {
            const techEmp = validTechMap.get(techId);
            if (techEmp?.user_id) {
              assignedNotifications.push({ userId: techEmp.user_id, jobName: newJob.name });
            }
          }

          const targetFindingIds = new Set<number>();
          if (group.finding_id) targetFindingIds.add(Number(group.finding_id));
          if (Array.isArray(jobItem.matched_finding_ids)) {
            jobItem.matched_finding_ids.forEach((id) => targetFindingIds.add(Number(id)));
          }

          for (const findingId of targetFindingIds) {
            await tx.jobFinding.upsert({
              where: {
                job_id_finding_id: { job_id: newJob.id, finding_id: findingId },
              },
              create: { job_id: newJob.id, finding_id: findingId },
              update: {},
            });

            await tx.finding.update({
              where: { id: findingId },
              data: { status: 'LINKED_TO_JOB' },
            });
          }

          totalAppliedJobs++;
        }
      }

      await tx.auditLog.create({
        data: {
          user_id: advisorUserId,
          action: 'CREATE',
          entity_type: 'AI_JOB_PLAN_APPLY',
          entity_id: workOrderId,
          after_data: {
            appliedJobsCount: totalAppliedJobs,
            createdServicesCount: totalCreatedServices,
          },
        },
      });

      return {
        woNumber: workOrder.wo_number,
        applied_jobs_count: totalAppliedJobs,
        created_services_count: totalCreatedServices,
        assignedNotifications,
      };
    });

    // Notify assigned technicians asynchronously after transaction commit
    const notifiedKeys = new Set<string>();
    for (const notif of txResult.assignedNotifications) {
      const dedup = `${notif.userId}:${notif.jobName}`;
      if (notifiedKeys.has(dedup)) continue;
      notifiedKeys.add(dedup);
      notificationService
        .sendInApp({
          userId: notif.userId,
          type: 'TASK_ASSIGNED',
          title: `Phân công công việc mới: ${notif.jobName}`,
          message: `Bạn vừa được phân công công việc "${notif.jobName}" trong phiếu ${txResult.woNumber}.`,
          entityType: 'WORK_ORDER',
          entityId: workOrderId,
        })
        .catch((err) =>
          logger.warn('[AiJobPlannerService] Failed to notify technician', {
            error: (err as Error).message,
          })
        );
    }

    return {
      applied_jobs_count: txResult.applied_jobs_count,
      created_services_count: txResult.created_services_count,
    };
  }
}
