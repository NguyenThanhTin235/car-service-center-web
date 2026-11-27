import { RetrievedTechnician } from './rag-retriever.service';
import { stripViAccents } from '../../utils/vi-text.util';

export interface RawAIJobSuggestion {
  name: string;
  description: string;
  job_type_id: number;
  estimated_hours: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matched_finding_ids?: number[];
  suggested_part_category_ids?: number[];
  assigned_technician_id?: number | null;
  assigned_technician_name?: string | null;
  assignment_reason?: string | null;
  match_score?: number;
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

export function cleanJobName(name: string): string {
  return stripViAccents(name).replace(/[^a-z0-9]/g, '').trim();
}

const JOB_SKILL_PATTERNS: ReadonlyArray<{ jobHints: string[]; skillHints: string[] }> = [
  {
    jobHints: ['dien', 'obd', 'ac quy', 'binh dien', 'cam bien', 'ecu', 'khoi dong', 'may phat', 'den'],
    skillHints: ['dien', 'obd', 'chuan doan', 'ecu', 'dien tu'],
  },
  {
    jobHints: ['phanh', 'bo thang', 'dia phanh', 'gam', 'treo', 'rotuyn', 'ro tuyn', 'phuoc', 'giam xoc', 'thuoc lai', 'can mam', 'lop'],
    skillHints: ['gam', 'phanh', 'treo', 'lai', 'co khi'],
  },
  {
    jobHints: ['dong co', 'bugi', 'hop so', 'nhot', 'dau may', 'loc dau', 'loc gio', 'nuoc mat', 'ket nuoc', 'curoa', 'bao duong'],
    skillHints: ['dong co', 'may', 'co khi', 'bao duong', 'hop so'],
  },
  {
    jobHints: ['son', 'matit', 'bong', 'tray', 'xuoc', 'go', 'han', 'mop', 'can truoc', 'can sau', 'dong son'],
    skillHints: ['son', 'dong', 'go', 'han', 'dong son'],
  },
  {
    jobHints: ['dieu hoa', 'may lanh', 'loc lanh', 'gas lanh', 'dan lanh'],
    skillHints: ['dieu hoa', 'lanh', 'dien'],
  },
  {
    jobHints: ['noi that', 'cham soc', 've sinh', 'rua xe', 'danh bong', 'khu mui'],
    skillHints: ['cham soc', 'noi that', 've sinh', 'detail'],
  },
];

function hasSkillMatch(skills: string[], jobName: string, description: string): boolean {
  if (!skills || skills.length === 0) return false;
  const normJob = stripViAccents(`${jobName} ${description}`);
  const normSkills = skills.map((s) => stripViAccents(s)).join(' ');

  for (const rule of JOB_SKILL_PATTERNS) {
    const jobMatchesRule = rule.jobHints.some((h) => normJob.includes(h));
    if (jobMatchesRule) {
      return rule.skillHints.some((sh) => normSkills.includes(sh));
    }
  }

  // Fallback token overlap between job text and technician skill names
  const skillTokens = normSkills.split(' ').filter((w) => w.length >= 3);
  return skillTokens.some((tok) => normJob.includes(tok));
}

export class RagValidatorService {
  /**
   * Hậu kiểm tra, cân bằng tải KTV theo batch và chuẩn hóa dữ liệu trả về từ LLM.
   */
  validateAndSanitize(
    raw: RawAIPlanResponse,
    validJobTypeIds: number[],
    validFindingIds: number[],
    validPartCategoryIds: number[],
    validTechnicians: RetrievedTechnician[] = [],
    onIntervention?: (reason: string) => void
  ): SanitizedPlanResponse {
    const fallbackJobTypeId = validJobTypeIds[0] || 1;
    const MAX_DAILY_HOURS = 8.5;

    // Stateful intra-batch workload tracker so multiple jobs in one plan distribute fairly
    const projectedHours = new Map<number, number>();
    const projectedActive = new Map<number, number>();
    for (const t of validTechnicians) {
      projectedHours.set(t.id, t.today_assigned_hours);
      projectedActive.set(t.id, t.active_jobs_count);
    }

    const sanitizeJob = (job: RawAIJobSuggestion): RawAIJobSuggestion => {
      let finalJobTypeId = Number(job.job_type_id);
      if (!validJobTypeIds.includes(finalJobTypeId)) {
        console.warn(`[AI Guardrail] Invalid job_type_id: ${job.job_type_id}. Fallback to ${fallbackJobTypeId}`);
        onIntervention?.('invalid_job_type_id_fallback');
        finalJobTypeId = fallbackJobTypeId;
      }

      let hours = Number(job.estimated_hours);
      if (isNaN(hours) || hours <= 0) hours = 1.0;
      if (hours > 12.0) hours = 8.0;
      hours = Math.round(hours * 10) / 10;

      const matchedFindingIds = Array.isArray(job.matched_finding_ids)
        ? job.matched_finding_ids.map(Number).filter((fid) => validFindingIds.includes(fid))
        : [];

      const suggestedPartCategoryIds = Array.isArray(job.suggested_part_category_ids)
        ? job.suggested_part_category_ids
            .map(Number)
            .filter((pid) => validPartCategoryIds.includes(pid))
        : [];

      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const severity = validSeverities.includes(job.severity) ? job.severity : 'MEDIUM';

      const jobNameClean = (job.name || 'Công việc kỹ thuật').trim().slice(0, 255);
      const jobDescClean = (job.description || '').trim().slice(0, 1000);

      // Technician Assignment Guardrail (Load + Skill + Anti-Overload)
      let assignedTechId: number | null = null;
      let assignedTechName: string | null = null;
      let assignmentReason: string | null = job.assignment_reason || null;
      let matchScore: number = Number(job.match_score) || 85;

      const eligibleTechs = validTechnicians.filter((t) => {
        if (t.status === 'OVERLOADED') return false;
        const currHrs = projectedHours.get(t.id) ?? t.today_assigned_hours;
        return currHrs + hours <= MAX_DAILY_HOURS;
      });

      const requestedTechId = job.assigned_technician_id ? Number(job.assigned_technician_id) : null;
      const requestedEligible = requestedTechId
        ? eligibleTechs.find((t) => t.id === requestedTechId)
        : undefined;

      if (requestedEligible) {
        assignedTechId = requestedEligible.id;
        assignedTechName = requestedEligible.full_name;
        const currHrs = projectedHours.get(requestedEligible.id) ?? requestedEligible.today_assigned_hours;
        projectedHours.set(requestedEligible.id, Math.round((currHrs + hours) * 10) / 10);
        if (!assignmentReason) {
          assignmentReason = `Được AI đề xuất dựa trên chuyên môn [${
            requestedEligible.skills.join(', ') || 'Kỹ thuật viên'
          }] và cân bằng tải.`;
        }
      } else if (eligibleTechs.length > 0) {
        if (requestedTechId) {
          onIntervention?.('overloaded_or_invalid_tech_reassigned');
        }
        const ranked = eligibleTechs
          .map((t) => {
            const currHrs = projectedHours.get(t.id) ?? t.today_assigned_hours;
            const currAct = projectedActive.get(t.id) ?? t.active_jobs_count;
            const skillMatched = hasSkillMatch(t.skills, jobNameClean, jobDescClean);
            const effectiveScore = currHrs + currAct * 2 - (skillMatched ? 3.0 : 0);
            return { tech: t, currHrs, skillMatched, effectiveScore };
          })
          .sort((a, b) => a.effectiveScore - b.effectiveScore);

        const chosen = ranked[0];
        assignedTechId = chosen.tech.id;
        assignedTechName = chosen.tech.full_name;
        projectedHours.set(chosen.tech.id, Math.round((chosen.currHrs + hours) * 10) / 10);
        assignmentReason = chosen.skillMatched
          ? `Tự động phân công: Khớp chuyên môn [${chosen.tech.skills.join(', ')}] và tải tối ưu (${chosen.currHrs}h).`
          : `Tự động phân công: Có tải công việc thấp nhất trong ngày (${chosen.currHrs}h).`;
        matchScore = chosen.skillMatched ? 88 : 80;
      } else if (validTechnicians.length > 0) {
        onIntervention?.('all_technicians_overloaded_unassigned');
        assignedTechId = null;
        assignedTechName = null;
        assignmentReason =
          'Tất cả kỹ thuật viên phù hợp hiện đang quá tải — Cố vấn vui lòng điều phối thủ công.';
        matchScore = 0;
      }

      return {
        name: jobNameClean,
        description: jobDescClean,
        job_type_id: finalJobTypeId,
        estimated_hours: hours,
        severity: severity as RawAIJobSuggestion['severity'],
        matched_finding_ids: matchedFindingIds,
        suggested_part_category_ids: suggestedPartCategoryIds,
        assigned_technician_id: assignedTechId,
        assigned_technician_name: assignedTechName,
        assignment_reason: assignmentReason,
        match_score: matchScore,
      };
    };

    let sanitizedServices: RawAIServiceGroup[] = [];

    if (Array.isArray(raw.suggested_services) && raw.suggested_services.length > 0) {
      sanitizedServices = raw.suggested_services.map((grp) => {
        const findingId =
          grp.finding_id && validFindingIds.includes(Number(grp.finding_id))
            ? Number(grp.finding_id)
            : null;

        const categoryType = ['REPAIR', 'MAINTENANCE', 'OTHER'].includes(grp.category_type)
          ? grp.category_type
          : findingId
            ? 'REPAIR'
            : 'OTHER';

        const validJobs: RawAIJobSuggestion[] = [];
        const seenInGroup = new Set<string>();

        if (Array.isArray(grp.jobs)) {
          for (const j of grp.jobs) {
            const sj = sanitizeJob(j);
            const normName = cleanJobName(sj.name);
            if (!normName) continue;
            if (seenInGroup.has(normName)) {
              console.warn(`[AI Guardrail] Bỏ qua công việc trùng lặp trong nhóm "${grp.service_name}": ${sj.name}`);
              onIntervention?.('duplicate_job_filtered');
              continue;
            }
            seenInGroup.add(normName);

            if (findingId && (!sj.matched_finding_ids || sj.matched_finding_ids.length === 0)) {
              sj.matched_finding_ids = [findingId];
            }
            validJobs.push(sj);
          }
        }

        return {
          service_id: grp.service_id ? Number(grp.service_id) : null,
          service_name: (grp.service_name || (findingId ? `Sửa chữa lỗi #${findingId}` : 'Dịch vụ tổng hợp')).trim(),
          category_type: categoryType,
          finding_id: findingId,
          jobs: validJobs,
        };
      });
    } else if (Array.isArray(raw.suggested_jobs) && raw.suggested_jobs.length > 0) {
      const findingGroups = new Map<number | 'OTHER', RawAIJobSuggestion[]>();
      const seenJobs = new Set<string>();

      for (const job of raw.suggested_jobs) {
        const sj = sanitizeJob(job);
        const normName = cleanJobName(sj.name);
        if (!normName || seenJobs.has(normName)) continue;
        seenJobs.add(normName);

        const firstFinding =
          sj.matched_finding_ids && sj.matched_finding_ids.length > 0 ? sj.matched_finding_ids[0] : 'OTHER';

        if (!findingGroups.has(firstFinding)) {
          findingGroups.set(firstFinding, []);
        }
        findingGroups.get(firstFinding)!.push(sj);
      }

      sanitizedServices = Array.from(findingGroups.entries()).map(([fid, jobs]) =>
        typeof fid === 'number'
          ? {
              service_name: `Khắc phục lỗi #${fid}`,
              category_type: 'REPAIR' as const,
              finding_id: fid,
              jobs,
            }
          : {
              service_name: 'Dịch vụ kỹ thuật & bảo dưỡng',
              category_type: 'OTHER' as const,
              finding_id: null,
              jobs,
            }
      );
    }

    const allFlattenedJobs: RawAIJobSuggestion[] = sanitizedServices.flatMap((s) => s.jobs);

    return {
      summary: raw.summary || 'Đã phân tích kế hoạch công việc dựa trên tình trạng xe.',
      risk_assessment:
        raw.risk_assessment || 'Hệ thống vận hành cần được kiểm tra bảo dưỡng theo đúng tiêu chuẩn.',
      suggested_services: sanitizedServices,
      suggested_jobs: allFlattenedJobs,
    };
  }
}
