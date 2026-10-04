'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  WorkOrder,
  WoService,
  ServiceTemplateOption,
  addServiceToWO,
  removeServiceFromWO,
  getServiceCatalog,
} from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface TabJobProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-[#856404]', bg: 'bg-[#FFF3CD]', icon: 'schedule' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'text-[#004085]', bg: 'bg-[#CCE5FF]', icon: 'autorenew' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-[#155724]', bg: 'bg-[#D4EDDA]', icon: 'check_circle' },
};

const PRICING_TYPE_MAP: Record<string, string> = {
  FIXED: 'Trọn gói',
  VEHICLE_SIZE: 'Theo loại xe',
  LABOUR_PARTS: 'Nhân công & Phụ tùng',
};

export default function TabJob({ workOrder, refetchWO }: TabJobProps) {
  const services = workOrder?.services || [];
  const isWOClosed = ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');

  // Add service state
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState<ServiceTemplateOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load catalog when dropdown opens
  useEffect(() => {
    if (isAdding && catalog.length === 0) {
      loadCatalog();
    }
  }, [isAdding]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAdding(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const data = await getServiceCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh mục dịch vụ');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleAddService = async (templateId: number) => {
    if (!workOrder || submitting) return;
    try {
      setSubmitting(true);
      const res = await addServiceToWO(workOrder.id, templateId);
      if (res.success) {
        toast.success(res.message || 'Thêm dịch vụ thành công');
        setIsAdding(false);
        setSearchTerm('');
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi thêm dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveService = async (woServiceId: number) => {
    if (!workOrder || deleting) return;
    try {
      setDeleting(true);
      const res = await removeServiceFromWO(workOrder.id, woServiceId);
      if (res.success) {
        toast.success(res.message || 'Đã xóa dịch vụ');
        setDeleteConfirm(null);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xóa dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa dịch vụ');
    } finally {
      setDeleting(false);
    }
  };

  // Filter catalog: exclude already-added services
  const existingTemplateIds = services
    .map((s) => s.service_id)
    .filter((id): id is number => id !== null);

  const filteredCatalog = catalog.filter(
    (t) =>
      !existingTemplateIds.includes(t.id) &&
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Empty state
  if (services.length === 0 && isWOClosed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
        <span className="material-symbols-outlined text-[48px] text-outline mb-2">playlist_remove</span>
        <h3 className="text-title-md font-bold text-on-surface">Không có dịch vụ</h3>
        <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
          Phiếu công việc này không có hạng mục dịch vụ nào.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
            Hạng mục dịch vụ
          </h3>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-label-sm font-bold">
            {services.length}
          </span>
        </div>

        {/* Add Service Button / Dropdown */}
        {!isWOClosed && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-label-md font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm dịch vụ
            </button>

            {/* Dropdown Catalog */}
            {isAdding && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-50 overflow-hidden">
                {/* Search */}
                <div className="p-3 border-b border-outline-variant/40">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm dịch vụ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-body-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                {/* List */}
                <div className="max-h-64 overflow-y-auto styled-scrollbar">
                  {loadingCatalog ? (
                    <div className="p-6 text-center text-on-surface-variant text-body-sm flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      Đang tải danh mục...
                    </div>
                  ) : filteredCatalog.length > 0 ? (
                    <ul className="py-1">
                      {filteredCatalog.map((template) => (
                        <li key={template.id}>
                          <button
                            onClick={() => handleAddService(template.id)}
                            disabled={submitting}
                            className="w-full text-left px-4 py-3 hover:bg-surface-container-low focus:bg-surface-container-low outline-none transition-colors flex items-center justify-between gap-3 disabled:opacity-50"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-body-sm text-on-surface block truncate">
                                {template.name}
                              </span>
                            </div>
                            <span className="text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium shrink-0">
                              {PRICING_TYPE_MAP[template.pricing_type] || template.pricing_type}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-on-surface-variant text-body-sm">
                      {searchTerm
                        ? 'Không tìm thấy dịch vụ phù hợp'
                        : 'Tất cả dịch vụ đã được thêm'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Table */}
      {services.length > 0 ? (
        <div className="border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40">
                <th className="text-left px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider w-10">
                  #
                </th>
                <th className="text-left px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Tên dịch vụ
                </th>
                <th className="text-left px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider w-40">
                  Danh mục
                </th>
                <th className="text-left px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider w-40">
                  Loại giá
                </th>
                <th className="text-left px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider w-36">
                  Trạng thái
                </th>
                {!isWOClosed && (
                  <th className="text-center px-4 py-3 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider w-20">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {services.map((svc, idx) => {
                const statusInfo = STATUS_MAP[svc.status] || STATUS_MAP.PENDING;
                const isConfirmingDelete = deleteConfirm === svc.id;
                return (
                  <tr
                    key={svc.id}
                    className="border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-container-lowest/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-body-sm text-on-surface-variant font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-body-sm font-medium text-on-surface">{svc.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-body-sm text-on-surface-variant">
                      {svc.service?.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-body-sm text-on-surface-variant">
                        {PRICING_TYPE_MAP[svc.pricing_type] || svc.pricing_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </td>
                    {!isWOClosed && (
                      <td className="px-4 py-3.5 text-center">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleRemoveService(svc.id)}
                              disabled={deleting}
                              className="text-error hover:bg-error/10 p-1 rounded transition-colors disabled:opacity-50"
                              title="Xác nhận xóa"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {deleting ? 'progress_activity' : 'check'}
                              </span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded transition-colors"
                              title="Hủy"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(svc.id)}
                            className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1 rounded transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
          <span className="material-symbols-outlined text-[48px] text-outline mb-2">playlist_add</span>
          <h3 className="text-title-md font-bold text-on-surface">Chưa có dịch vụ nào</h3>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
            Nhấn <strong>"Thêm dịch vụ"</strong> để chọn các hạng mục dịch vụ từ danh mục cho phiếu công việc này.
          </p>
        </div>
      )}
    </div>
  );
}
