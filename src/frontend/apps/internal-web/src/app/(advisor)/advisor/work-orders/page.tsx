'use client';
import React, { useEffect, useState } from 'react';
import { WorkOrder, getWorkOrders } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function WorkOrdersPage() {
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWOs = async () => {
    try {
      setLoading(true);
      const res = await getWorkOrders({ limit: 100 });
      if (res.success) {
        setItems(res.data);
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách phiếu công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWOs();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1440px] mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Phiếu công việc</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Quản lý tất cả Lệnh sửa chữa (Work Orders) trong xưởng dịch vụ.
          </p>
        </div>
      </div>
      
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden shadow-sm min-h-[300px] flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Mã phiếu (RO)</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Trạng thái</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Khách hàng</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Phương tiện</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Cố vấn</th>
                  <th className="px-5 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-on-surface-variant">
                      Không có phiếu công việc nào
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/advisor/work-orders/${item.id}`)}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-primary group-hover:underline">
                        {item.wo_number}
                      </td>
                      <td className="px-5 py-4 text-label-sm font-semibold">
                        <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-on-surface font-semibold">
                        {item.customer?.full_name || 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-on-surface">
                        <span className="uppercase font-medium">{item.vehicle?.license_plate || 'N/A'}</span>
                        {item.vehicle?.make && ` - ${item.vehicle.make}`}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">
                        {item.advisor?.full_name || 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
