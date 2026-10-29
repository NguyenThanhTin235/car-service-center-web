import prisma from '../utils/prisma';
import { InvoiceStatus } from '@prisma/client';

type ReportType = 'revenue' | 'services' | 'inventory';

class ReportService {
  async getOperationalReport(type: ReportType, start?: string, end?: string) {
    switch (type) {
      case 'revenue':   return this.getRevenueReport(start, end);
      case 'services':  return this.getServicesReport(start, end);
      case 'inventory': return this.getInventoryReport();
      default: throw new Error('Loai bao cao khong hop le');
    }
  }

  private async getRevenueReport(start?: string, end?: string) {
    const startDate = start ? new Date(start) : this.defaultStartDate();
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID, issued_at: { gte: startDate, lte: endDate } },
      select: { id: true, invoice_number: true, total_amount: true, issued_at: true },
      orderBy: { issued_at: 'asc' },
    });

    const byDate: Record<string, { date: string; totalRevenue: number; count: number }> = {};
    for (const inv of invoices) {
      if (!inv.issued_at) continue;
      const dateKey = inv.issued_at.toISOString().slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, totalRevenue: 0, count: 0 };
      byDate[dateKey].totalRevenue += Number(inv.total_amount);
      byDate[dateKey].count += 1;
    }

    const data = Object.values(byDate);
    const totalRevenue = invoices.reduce((sum: number, i) => sum + Number(i.total_amount), 0);
    return {
      type: 'revenue', period: { start: startDate.toISOString(), end: endDate.toISOString() },
      data, summary: { totalRevenue, totalInvoices: invoices.length },
    };
  }

  private async getServicesReport(start?: string, end?: string) {
    const startDate = start ? new Date(start) : this.defaultStartDate();
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const grouped = await prisma.woService.groupBy({
      by: ['service_id'],
      where: { work_order: { created_at: { gte: startDate, lte: endDate } }, service_id: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const serviceIds = grouped.map((g) => g.service_id).filter((id): id is number => id !== null);
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } });
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));

    const data = grouped.map((g) => ({
      serviceId: g.service_id,
      serviceName: g.service_id ? (serviceMap.get(g.service_id) ?? 'Khong ro') : 'Khong ro',
      count: g._count.id,
    }));

    return {
      type: 'services', period: { start: startDate.toISOString(), end: endDate.toISOString() },
      data, summary: { totalWorkOrders: data.reduce((s: number, d) => s + d.count, 0) },
    };
  }

  private async getInventoryReport() {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: { is_active: true },
      include: { part_category: { select: { name: true, code: true } }, brand: { select: { name: true } } },
      orderBy: { on_hand: 'asc' },
    });

    const filtered = lowStockItems.filter((item) => item.on_hand <= item.reorder_level);
    const data = filtered.map((item) => ({
      id: item.id, sku: item.sku,
      name: item.brand ? `${item.part_category.name} - ${item.brand.name}` : item.part_category.name,
      categoryName: item.part_category.name,
      onHand: item.on_hand, reorderLevel: item.reorder_level,
      deficit: item.reorder_level - item.on_hand,
    }));

    return { type: 'inventory', period: null, data, summary: { lowStockCount: data.length } };
  }

  private defaultStartDate(): Date {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  }
}

export const reportService = new ReportService();
