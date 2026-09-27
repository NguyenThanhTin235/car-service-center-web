'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WorkOrder, getWorkOrderById } from '@/lib/api/work-order.api';
import Link from 'next/link';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const response = await getWorkOrderById(id);
        if (response.success) {
          setWorkOrder(response.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi tải phiếu công việc');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined text-[48px] text-error">error_outline</span>
        <p className="text-headline-md font-headline-md text-on-surface-variant">{error || 'Không tìm thấy phiếu công việc'}</p>
        <Link href="/advisor" className="text-primary underline text-body-md font-body-md">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-label-md font-label-md text-on-surface-variant">
        <Link href="/advisor" className="hover:text-primary transition-colors">Waitlist</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-semibold">{workOrder.wo_number}</span>
      </div>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
                {workOrder.wo_number}
              </h1>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-label-sm font-label-sm font-bold uppercase">
                {workOrder.status}
              </span>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              Tạo lúc: {new Date(workOrder.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-outline-variant/40">
          {/* Customer */}
          <div className="flex flex-col gap-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Khách hàng</span>
            <span className="text-body-md font-body-md font-semibold text-on-surface">{workOrder.customer.full_name}</span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">{workOrder.customer.phone}</span>
          </div>

          {/* Vehicle */}
          <div className="flex flex-col gap-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Phương tiện</span>
            <span className="text-body-md font-body-md font-semibold text-on-surface">
              {workOrder.vehicle.make} {workOrder.vehicle.model}
            </span>
            <span className="bg-on-surface text-on-primary px-2 py-0.5 rounded text-label-sm font-label-sm font-bold tracking-wider w-fit">
              {workOrder.vehicle.license_plate}
            </span>
          </div>

          {/* Advisor */}
          <div className="flex flex-col gap-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Cố vấn dịch vụ</span>
            <span className="text-body-md font-body-md font-semibold text-on-surface">{workOrder.advisor.full_name}</span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">Nguồn: {workOrder.source_type}</span>
          </div>
        </div>
      </div>

      {/* Placeholder for future UC features */}
      <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant p-12 flex flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline">construction</span>
        <p className="text-headline-md font-headline-md text-on-surface-variant">Khu vực đang phát triển</p>
        <p className="text-body-sm font-body-sm text-outline max-w-md">
          Các chức năng tiếp theo sẽ được xây dựng tại đây: Ghi nhận tình trạng xe (UC-30), Kiểm tra xe (UC-33), Thêm dịch vụ (UC-31), Lên kế hoạch (UC-34)...
        </p>
      </div>
    </div>
  );
}
