'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getInvoicePreview, createInvoiceDraft, InvoicePreview } from '@/lib/api/invoice.api';
import InvoiceLinesTable from './InvoiceLinesTable';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number;
  onSuccess: () => void;
}

export default function CreateInvoiceDraftModal({
  isOpen,
  onClose,
  workOrderId,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && workOrderId) {
      loadPreview();
    }
  }, [isOpen, workOrderId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvoicePreview(workOrderId);
      setPreview(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Không thể tải bản xem trước hóa đơn.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const res = await createInvoiceDraft({
        workOrderId,
        notes: notes.trim() || undefined,
      });
      toast.success('Tạo hóa đơn nháp thành công!');
      onSuccess();
      onClose();
      if (res.data?.id) {
        router.push(`/staff/billing/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo hóa đơn nháp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">Tạo hóa đơn dịch vụ mới</h2>
              {preview && (
                <p className="text-xs text-on-surface-variant">
                  Phiếu công việc: <strong className="font-mono text-primary">{preview.woNumber}</strong> | Xe: <strong>{preview.vehicle.licensePlate}</strong> ({preview.vehicle.make} {preview.vehicle.model})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant space-y-3">
              <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
              <p className="text-sm">Đang tính toán chi phí từ các báo giá đã duyệt...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] shrink-0 mt-0.5">error</span>
              <div>
                <h4 className="font-bold text-sm">Chưa đủ điều kiện tạo hóa đơn</h4>
                <p className="text-sm mt-1 text-on-surface-variant">{error}</p>
              </div>
            </div>
          ) : preview ? (
            <>
              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant text-sm">
                <div>
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Khách hàng & Liên hệ
                  </span>
                  <div className="font-bold text-on-surface">{preview.customer.fullName}</div>
                  <div className="text-on-surface-variant text-xs mt-0.5">SĐT: {preview.customer.phone || '-'} | Email: {preview.customer.email || '-'}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Cố vấn dịch vụ phụ trách
                  </span>
                  <div className="font-bold text-on-surface">{preview.advisor.fullName}</div>
                  <div className="text-on-surface-variant text-xs mt-0.5">Báo giá nguồn: {preview.sourceQuotationNumbers.join(', ') || 'N/A'}</div>
                </div>
              </div>

              {/* Reconciliation warning if any */}
              {preview.reconciliationNotes && preview.reconciliationNotes.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span>Đối soát xuất kho phụ tùng thực tế (Case D):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-0.5 pl-1">
                    {preview.reconciliationNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lines Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-on-surface">Bảng chi tiết các hạng mục thanh toán ({preview.lines.length})</h3>
                  <span className="text-xs text-on-surface-variant">Quy chế Không Thuế (VAT 0%)</span>
                </div>
                <InvoiceLinesTable lines={preview.lines as any} />
              </div>

              {/* Cost Summary */}
              <div className="flex flex-col items-end pt-3 border-t border-outline-variant space-y-1.5 text-sm">
                <div className="w-72 flex justify-between text-on-surface-variant">
                  <span>Tổng tiền dịch vụ:</span>
                  <span className="font-medium text-on-surface">{formatMoney(preview.subtotal)}</span>
                </div>
                {preview.defaultDiscount > 0 && (
                  <div className="w-72 flex justify-between text-error font-medium">
                    <span>Chiết khấu báo giá:</span>
                    <span>- {formatMoney(preview.defaultDiscount)}</span>
                  </div>
                )}
                <div className="w-72 flex justify-between text-on-surface-variant text-xs">
                  <span>Thuế GTGT (VAT 0%):</span>
                  <span>0 đ</span>
                </div>
                <div className="w-72 flex justify-between text-base font-bold text-on-surface pt-2 border-t border-outline-variant">
                  <span>Tổng thanh toán:</span>
                  <span className="text-primary text-lg">{formatMoney(preview.totalAmount)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Ghi chú trên hóa đơn (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  placeholder="Nhập ghi chú thêm cho khách hàng hoặc nhắc nhở bảo hành..."
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Đóng
          </button>
          {preview && !error && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Xác nhận tạo hóa đơn nháp</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

