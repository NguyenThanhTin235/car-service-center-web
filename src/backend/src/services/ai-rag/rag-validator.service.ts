export interface RawAIJobSuggestion {
  name: string;
  description: string;
  job_type_id: number;
  estimated_hours: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matched_finding_ids?: number[];
  suggested_part_category_ids?: number[];
}

export interface RawAIServiceGroup {
  service_id?: number | null;
  service_name: string;
  category_type: 'REPAIR' | 'MAINTENANCE' | 'OTHER';
  finding_id?: number | null;
  jobs: RawAIJobSuggestion[];
}

export interface RawAIPlanResponse {
  summary: string;
  risk_assessment?: string;
  suggested_services?: RawAIServiceGroup[];
  suggested_jobs?: RawAIJobSuggestion[];
}

export interface SanitizedPlanResponse {
  summary: string;
  risk_assessment?: string;
  suggested_services: RawAIServiceGroup[];
  suggested_jobs: RawAIJobSuggestion[];
}

export class RagValidatorService {
  /**
   * Hậu kiểm tra và chuẩn hóa dữ liệu trả về từ LLM
   */
  validateAndSanitize(
    raw: RawAIPlanResponse,
    validJobTypeIds: number[],
    validFindingIds: number[],
    validPartCategoryIds: number[]
  ): SanitizedPlanResponse {
    const fallbackJobTypeId = validJobTypeIds[0] || 1;

    // Helper validate 1 job
    const sanitizeJob = (job: RawAIJobSuggestion): RawAIJobSuggestion => {
      let finalJobTypeId = Number(job.job_type_id);
      if (!validJobTypeIds.includes(finalJobTypeId)) {
        console.warn(`[AI Guardrail] Invalid job_type_id: ${job.job_type_id}. Fallback to ${fallbackJobTypeId}`);
        finalJobTypeId = fallbackJobTypeId;
      }

      let hours = Number(job.estimated_hours);
      if (isNaN(hours) || hours <= 0) hours = 1.0;
      if (hours > 12.0) hours = 8.0;
      hours = Math.round(hours * 10) / 10;

      const matchedFindingIds = Array.isArray(job.matched_finding_ids)
        ? job.matched_finding_ids
            .map(Number)
            .filter((fid) => validFindingIds.includes(fid))
        : [];

      const suggestedPartCategoryIds = Array.isArray(job.suggested_part_category_ids)
        ? job.suggested_part_category_ids
            .map(Number)
            .filter((pid) => validPartCategoryIds.includes(pid))
        : [];

      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const severity = validSeverities.includes(job.severity) ? job.severity : 'MEDIUM';

      return {
        name: (job.name || 'Công việc kỹ thuật').trim(),
        description: (job.description || '').trim(),
        job_type_id: finalJobTypeId,
        estimated_hours: hours,
        severity: severity as any,
        matched_finding_ids: matchedFindingIds,
        suggested_part_category_ids: suggestedPartCategoryIds,
      };
    };

    let sanitizedServices: RawAIServiceGroup[] = [];

    // Trường hợp 1: AI trả về danh sách phân nhóm `suggested_services`
    if (Array.isArray(raw.suggested_services) && raw.suggested_services.length > 0) {
      sanitizedServices = raw.suggested_services.map((grp) => {
        const findingId = grp.finding_id && validFindingIds.includes(Number(grp.finding_id))
          ? Number(grp.finding_id)
          : null;

        const categoryType = ['REPAIR', 'MAINTENANCE', 'OTHER'].includes(grp.category_type)
          ? grp.category_type
          : findingId ? 'REPAIR' : 'OTHER';

        const validJobs = Array.isArray(grp.jobs)
          ? grp.jobs.map((j) => {
              const sj = sanitizeJob(j);
              // Nếu hạng mục là REPAIR và có finding_id nhưng job chưa có matched_finding_ids thì tự động bổ sung
              if (findingId && (!sj.matched_finding_ids || sj.matched_finding_ids.length === 0)) {
                sj.matched_finding_ids = [findingId];
              }
              return sj;
            })
          : [];

        return {
          service_id: grp.service_id ? Number(grp.service_id) : null,
          service_name: (grp.service_name || (findingId ? `Sửa chữa lỗi #${findingId}` : 'Dịch vụ tổng hợp')).trim(),
          category_type: categoryType,
          finding_id: findingId,
          jobs: validJobs,
        };
      });
    } else if (Array.isArray(raw.suggested_jobs) && raw.suggested_jobs.length > 0) {
      // Trường hợp 2: AI trả về mảng phẳng suggested_jobs -> Tự động nhóm theo finding_id
      const findingGroups = new Map<number | 'OTHER', RawAIJobSuggestion[]>();

      for (const job of raw.suggested_jobs) {
        const sj = sanitizeJob(job);
        const firstFinding = sj.matched_finding_ids && sj.matched_finding_ids.length > 0
          ? sj.matched_finding_ids[0]
          : 'OTHER';

        if (!findingGroups.has(firstFinding)) {
          findingGroups.set(firstFinding, []);
        }
        findingGroups.get(firstFinding)!.push(sj);
      }

      sanitizedServices = Array.from(findingGroups.entries()).map(([fid, jobs]) => {
        if (typeof fid === 'number') {
          return {
            service_name: `Khắc phục lỗi #${fid}`,
            category_type: 'REPAIR' as const,
            finding_id: fid,
            jobs,
          };
        } else {
          return {
            service_name: 'Dịch vụ kỹ thuật & bảo dưỡng',
            category_type: 'OTHER' as const,
            finding_id: null,
            jobs,
          };
        }
      });
    }

    // Danh sách phẳng tất cả các jobs (cho backward compatibility)
    const allFlattenedJobs: RawAIJobSuggestion[] = sanitizedServices.flatMap((s) => s.jobs);

    return {
      summary: raw.summary || 'Đã phân tích kế hoạch công việc dựa trên tình trạng xe.',
      risk_assessment: raw.risk_assessment || 'Hệ thống vận hành cần được kiểm tra bảo dưỡng theo đúng tiêu chuẩn.',
      suggested_services: sanitizedServices,
      suggested_jobs: allFlattenedJobs,
    };
  }
}
