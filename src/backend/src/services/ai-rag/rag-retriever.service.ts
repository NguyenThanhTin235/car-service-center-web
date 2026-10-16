import prisma from '../../utils/prisma';
import { ItemType } from '@prisma/client';

export interface RetrievedKnowledge {
  jobTypes: Array<{ id: number; name: string }>;
  jobTemplates: Array<{ id: number; name: string; estimated_hours: number | null; job_type_id: number; service_name?: string }>;
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
}

export class RagRetrieverService {
  /**
   * Truy xuất toàn bộ tri thức định chuẩn của hệ thống dựa trên từ khóa lỗi và triệu chứng xe
   */
  async retrieveKnowledge(keywords: string[]): Promise<RetrievedKnowledge> {
    // 1. Lấy danh sách 8 JobTypes chuẩn
    const jobTypes = await prisma.jobType.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });

    // 2. Lấy các JobTemplate định mức của hệ thống
    const jobTemplates = await prisma.jobTemplate.findMany({
      select: {
        id: true,
        name: true,
        estimated_hours: true,
        job_type_id: true,
        service: { select: { name: true } },
      },
      take: 40,
    });

    // 3. Truy xuất PartCategory & InventoryItem (Master - Variant) liên quan
    // Xây dựng điều kiện tìm kiếm theo keywords trích xuất từ Finding và Complaint
    const searchConditions = keywords
      .map((kw) => kw.trim())
      .filter((kw) => kw.length >= 2)
      .map((kw) => ({ name: { contains: kw } }));

    const categories = await prisma.partCategory.findMany({
      where: searchConditions.length > 0 ? { OR: searchConditions } : undefined,
      include: {
        uom: true,
        inventory_items: {
          where: { is_active: true },
          include: { brand: true },
          take: 3,
        },
      },
      take: 15,
    });

    const matchingPartCategories = categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      item_type: c.item_type,
      uom: c.uom.name,
      variants: c.inventory_items.map((v) => ({
        sku: v.sku,
        brand_name: v.brand?.name || null,
        selling_price: v.selling_price.toString(),
        on_hand: v.on_hand,
      })),
    }));

    // 4. Lấy tiền lệ sửa chữa tương tự (Top-3 WorkOrders trong quá khứ có trạng thái hoàn tất)
    const completedWos = await prisma.workOrder.findMany({
      where: {
        status: { in: ['CLOSED', 'RELEASED', 'FINANCIAL_CLEARED'] },
        check_in: { isNot: null },
      },
      include: {
        check_in: true,
        inspections: {
          include: { findings: true },
        },
        services: {
          include: { jobs: true },
        },
      },
      take: 3,
      orderBy: { created_at: 'desc' },
    });

    const historicalCases = completedWos.map((wo: any) => {
      const findings = (wo.inspections || []).flatMap((insp: any) => (insp.findings || []).map((f: any) => f.description));
      const jobs = (wo.services || []).flatMap((s: any) => (s.jobs || []).map((j: any) => `${j.name} (${j.estimated_hours || 1}h)`));
      return {
        work_order_number: wo.wo_number,
        complaint: wo.check_in?.complaint || null,
        findings,
        jobs,
      };
    });


    return {
      jobTypes,
      jobTemplates: jobTemplates.map((jt) => ({
        id: jt.id,
        name: jt.name,
        estimated_hours: jt.estimated_hours ? Number(jt.estimated_hours) : null,
        job_type_id: jt.job_type_id,
        service_name: jt.service?.name,
      })),
      matchingPartCategories,
      historicalCases,
    };
  }

  /**
   * Helper trích xuất từ khóa kỹ thuật từ danh sách finding và triệu chứng
   */
  extractKeywords(texts: string[]): string[] {
    const commonCarKeywords = [
      'phanh', 'má phanh', 'đĩa phanh', 'dầu phanh',
      'dầu máy', 'nhớt', 'lọc dầu', 'lọc gió',
      'bugi', 'bô bin', 'ắc quy', 'máy phát',
      'phuộc', 'giảm xóc', 'thước lái', 'rotuyn',
      'cản trước', 'cản sau', 'tai vè', 'cửa', 'sơn', 'móp', 'trầy',
      'hộp số', 'ly hợp', 'điều hòa', 'làm mát', 'nước mát', 'gạt mưa'
    ];

    const joinedText = texts.join(' ').toLowerCase();
    return commonCarKeywords.filter((kw) => joinedText.includes(kw));
  }
}
