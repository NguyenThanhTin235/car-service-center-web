import prisma from '../../utils/prisma';
import { ItemType } from '@prisma/client';
import { getCache, setCache } from '../../utils/redis.util';
import { scoreViTextMatch, stripViAccents, tokenizeViKeywords } from '../../utils/vi-text.util';

export interface RetrievedTechnician {
  id: number;
  full_name: string;
  skills: string[];
  active_jobs_count: number;
  today_assigned_hours: number;
  status: 'AVAILABLE' | 'BUSY' | 'OVERLOADED';
}

export interface RetrievedKnowledge {
  jobTypes: Array<{ id: number; name: string }>;
  jobTemplates: Array<{
    id: number;
    name: string;
    estimated_hours: number | null;
    price?: number;
    job_type_id: number;
    service_name?: string;
  }>;
  matchingPartCategories: Array<{
    id: number;
    code: string;
    name: string;
    item_type: ItemType;
    uom: string;
    variants: Array<{ sku: string; brand_name?: string | null; selling_price: string; on_hand: number }>;
  }>;
  historicalCases: Array<{
    work_order_number: string;
    complaint: string | null;
    findings: string[];
    jobs: string[];
  }>;
  technicians: RetrievedTechnician[];
}

export interface RetrieveKnowledgeContext {
  make?: string;
  model?: string;
  size?: string;
  rawTexts?: string[];
}

interface CachedMasterCatalog {
  jobTypes: Array<{ id: number; name: string }>;
  jobTemplates: Array<{
    id: number;
    name: string;
    estimated_hours: number | null;
    price: number;
    job_type_id: number;
    service_name?: string;
  }>;
  partCategories: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
    item_type: ItemType;
    uom: string;
    variants: Array<{ sku: string; brand_name?: string | null; selling_price: string; on_hand: number }>;
  }>;
}

const RAG_MASTER_CACHE_KEY = 'catalog:ai_rag:master:v2';
const RAG_MASTER_CACHE_TTL_SECONDS = 300;
let inFlightMasterCatalog: Promise<CachedMasterCatalog> | null = null;

function getStartOfTodayVn(): Date {
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnNow = new Date(Date.now() + vnOffsetMs);
  vnNow.setUTCHours(0, 0, 0, 0);
  return new Date(vnNow.getTime() - vnOffsetMs);
}

async function loadMasterCatalog(): Promise<CachedMasterCatalog> {
  const cacheEnabled = process.env.NODE_ENV !== 'test';
  if (cacheEnabled) {
    try {
      const cached = await getCache(RAG_MASTER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as CachedMasterCatalog;
      }
    } catch {
      // Ignore cache read error
    }
  }

  if (inFlightMasterCatalog) {
    return inFlightMasterCatalog;
  }

  inFlightMasterCatalog = (async () => {
    const [jobTypes, jobTemplatesRaw, partCategoriesRaw] = await Promise.all([
      prisma.jobType.findMany({
        where: { is_active: true },
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      }),
      prisma.jobTemplate.findMany({
        select: {
          id: true,
          name: true,
          estimated_hours: true,
          price: true,
          job_type_id: true,
          service: { select: { name: true } },
        },
        take: 100,
        orderBy: { id: 'asc' },
      }),
      prisma.partCategory.findMany({
        where: { is_active: true },
        include: {
          uom: true,
          inventory_items: {
            where: { is_active: true },
            include: { brand: true },
            orderBy: { on_hand: 'desc' },
            take: 4,
          },
        },
        take: 300,
      }),
    ]);

    const master: CachedMasterCatalog = {
      jobTypes,
      jobTemplates: jobTemplatesRaw.map((jt) => ({
        id: jt.id,
        name: jt.name,
        estimated_hours: jt.estimated_hours ? Number(jt.estimated_hours) : null,
        price: Number(jt.price) || 0,
        job_type_id: jt.job_type_id,
        service_name: jt.service?.name,
      })),
      partCategories: partCategoriesRaw.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description || null,
        item_type: c.item_type,
        uom: c.uom?.name || 'Cái',
        variants: c.inventory_items.map((v) => ({
          sku: v.sku,
          brand_name: v.brand?.name || null,
          selling_price: v.selling_price.toString(),
          on_hand: v.on_hand,
        })),
      })),
    };

    if (cacheEnabled) {
      void setCache(RAG_MASTER_CACHE_KEY, JSON.stringify(master), RAG_MASTER_CACHE_TTL_SECONDS).catch(
        () => {}
      );
    }

    return master;
  })().finally(() => {
    inFlightMasterCatalog = null;
  });

  return inFlightMasterCatalog;
}

export class RagRetrieverService {
  /**
   * Truy xuất toàn bộ tri thức định chuẩn theo Hybrid Scoring (Accent-Insensitive + Cached Catalog + Parallel IO).
   */
  async retrieveKnowledge(
    keywords: string[],
    vehicleCtx?: RetrieveKnowledgeContext
  ): Promise<RetrievedKnowledge> {
    const startOfTodayVn = getStartOfTodayVn();
    const queryPool =
      vehicleCtx?.rawTexts && vehicleCtx.rawTexts.length > 0 ? vehicleCtx.rawTexts : keywords;

    const [master, completedWos, activeTechs] = await Promise.all([
      loadMasterCatalog(),
      prisma.workOrder.findMany({
        where: {
          status: { in: ['CLOSED', 'RELEASED', 'FINANCIAL_CLEARED'] },
          check_in: { isNot: null },
        },
        select: {
          wo_number: true,
          vehicle: { select: { make: true, model: true, vehicle_size: true } },
          check_in: { select: { complaint: true } },
          inspections: {
            select: {
              findings: { select: { description: true, part_name: true } },
            },
          },
          services: {
            select: {
              name: true,
              jobs: { select: { name: true, estimated_hours: true } },
            },
          },
        },
        take: 20,
        orderBy: { created_at: 'desc' },
      }),
      prisma.employee.findMany({
        where: {
          position: { in: ['TECHNICIAN', 'DETAILER'] },
          is_active: true,
        },
        include: {
          skills: {
            include: { skill: true },
          },
          job_labours: {
            where: {
              job: {
                wo_service: {
                  work_order: {
                    status: { notIn: ['CLOSED', 'CANCELLED', 'RELEASED'] },
                  },
                },
                OR: [
                  { status: { in: ['PLANNED', 'IN_PROGRESS', 'REWORK'] } },
                  {
                    status: { in: ['COMPLETED', 'PASSED'] },
                    completed_at: { gte: startOfTodayVn },
                  },
                ],
              },
            },
            include: {
              job: {
                select: {
                  status: true,
                  estimated_hours: true,
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    // 1. Ranked PartCategories (only categories with positive relevance score; never arbitrary table scan)
    const scoredCategories = master.partCategories
      .map((cat) => ({
        cat,
        score: scoreViTextMatch(queryPool, `${cat.name} ${cat.code} ${cat.description || ''}`),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ cat }) => ({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        item_type: cat.item_type,
        uom: cat.uom,
        variants: cat.variants,
      }));

    // 2. Ranked JobTemplates (relevant templates first, preserving coverage of #16..#30 Electrical/Body/Paint)
    const scoredTemplates = master.jobTemplates
      .map((jt) => ({
        jt,
        score: scoreViTextMatch(queryPool, `${jt.name} ${jt.service_name || ''}`),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
      .map(({ jt }) => jt);

    // 3. Relevant Historical Cases (filter & score by vehicle + symptoms/findings; exclude irrelevant WOs)
    const targetMake = stripViAccents(vehicleCtx?.make || '');
    const targetModel = stripViAccents(vehicleCtx?.model || '');
    const targetSize = stripViAccents(vehicleCtx?.size || '');

    const scoredHistory = completedWos
      .map((wo: any) => {
        const findings = (wo.inspections || []).flatMap((insp: any) =>
          (insp.findings || []).map((f: any) =>
            [f.part_name, f.description].filter(Boolean).join(' - ')
          )
        );
        const jobs = (wo.services || []).flatMap((s: any) =>
          (s.jobs || []).map((j: any) => `${j.name} (${j.estimated_hours || 1}h)`)
        );
        const svcNames = (wo.services || []).map((s: any) => s.name).filter(Boolean);

        const histText = [wo.check_in?.complaint || '', ...findings, ...svcNames, ...jobs].join(' ');
        let score = scoreViTextMatch(queryPool, histText);

        const woMake = stripViAccents(wo.vehicle?.make || '');
        const woModel = stripViAccents(wo.vehicle?.model || '');
        const woSize = stripViAccents(wo.vehicle?.vehicle_size || '');

        if (targetMake && woMake === targetMake) {
          score += targetModel && woModel === targetModel ? 4 : 2;
        } else if (targetSize && woSize === targetSize) {
          score += 1;
        }

        return {
          score,
          caseItem: {
            work_order_number: wo.wo_number,
            complaint: wo.check_in?.complaint || null,
            findings,
            jobs,
          },
        };
      })
      .filter((entry) => entry.score >= 3 && entry.caseItem.jobs.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.caseItem);

    // 4. Technician & Detailer workload from true active backlog + today's completed jobs
    const technicians: RetrievedTechnician[] = activeTechs.map((tech) => {
      const activeJobsCount = tech.job_labours.filter(
        (jl) => jl.job?.status === 'IN_PROGRESS' || jl.job?.status === 'REWORK'
      ).length;

      let backlogHours = 0;
      let totalRelevantHours = 0;

      for (const jl of tech.job_labours) {
        const hours = Number(jl.estimated_hours) || Number(jl.job?.estimated_hours) || 1.0;
        totalRelevantHours += hours;
        const st = jl.job?.status;
        if (!st || st === 'PLANNED' || st === 'IN_PROGRESS' || st === 'REWORK') {
          backlogHours += hours;
        }
      }

      let status: 'AVAILABLE' | 'BUSY' | 'OVERLOADED' = 'AVAILABLE';
      if (backlogHours >= 7 || totalRelevantHours >= 7.5 || activeJobsCount >= 3) {
        status = 'OVERLOADED';
      } else if (backlogHours >= 3.5 || activeJobsCount >= 1) {
        status = 'BUSY';
      }

      return {
        id: tech.id,
        full_name: tech.full_name,
        skills: tech.skills.map((s) => s.skill.name).filter(Boolean),
        active_jobs_count: activeJobsCount,
        today_assigned_hours: Math.round(totalRelevantHours * 10) / 10,
        status,
      };
    });

    return {
      jobTypes: master.jobTypes,
      jobTemplates: scoredTemplates,
      matchingPartCategories: scoredCategories,
      historicalCases: scoredHistory,
      technicians,
    };
  }

  /**
   * Trích xuất từ khóa kỹ thuật chuẩn hóa (không dấu, gom đồng nghĩa, loại bỏ stopwords).
   */
  extractKeywords(texts: string[]): string[] {
    return tokenizeViKeywords(texts, 20);
  }
}
