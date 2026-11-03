'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getInvoiceById,
  issueInvoice,
  cancelInvoice,
  downloadInvoicePdfBlob,
  InvoiceDetail,
} from '@/lib/api/invoice.api';
import InvoiceStatusBadge from '@/components/billing/InvoiceStatusBadge';
import InvoiceLinesTable from '@/components/billing/InvoiceLinesTable';
import DiscountEditorModal from '@/components/billing/DiscountEditorModal';
import PaymentModal from '@/components/billing/PaymentModal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params?.id);

  const [loading, setLoading] = useState<boolean>(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!confirm('Bạn có chắc chắn muốn phát hành hóa đơn chính thức cho khách hàng? Sau khi phát hành, chi phí sẽ được khóa cứng.')) {
      return;
    }
    try {
      setActionLoading(true);
      await issueInvoice(invoiceId);
      toast.success('Phát hành hóa đơn chính thức thành công! Đã gửi thông báo cho khách hàng.');
      await loadInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi phát hành hóa đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Vui lòng nhập lý do hủy hóa đơn này:');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error('Lý do hủy phải có ít nhất 3 ký tự!');
      return;
    }

    try {
      setActionLoading(true);
      await cancelInvoice(invoiceId, reason.trim());
      toast.success('Đã hủy hóa đơn thành công.');
      await loadInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi hủy hóa đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Đang khởi tạo file PDF...', { id: 'pdf-toast' });
      const blob = await downloadInvoicePdfBlob(invoiceId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hoa_Don_${invoice?.invoiceNumber || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã tải hóa đơn PDF thành công', { id: 'pdf-toast' });
    } catch (err: any) {
      toast.error('Không thể xuất file PDF: ' + err.message, { id: 'pdf-toast' });
    }
  };

  const formatMoney = (val: number | undefined) =>
    (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-on-surface-variant space-y-3">
        <span className="material-symbols-outlined text-[40px] animate-spin text-primary">progress_activity</span>
        <p className="text-sm font-medium">Đang tải thông tin chi tiết hóa đơn...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error-container/30 text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Không tìm thấy hóa đơn</h2>
        <p className="text-sm text-on-surface-variant">{error || 'Hóa đơn không tồn tại hoặc đã bị xóa.'}</p>
        <Link
          href="/staff/billing"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Quay lại hàng chờ</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Link
              href="/staff/billing"
              className="w-9 h-9 rounded-xl border border-outline-variant hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
              title="Quay lại danh sách"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-headline-sm font-extrabold text-on-surface font-mono">
                  {invoice.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Phiếu công việc:{' '}
                <span className="font-mono font-bold text-primary">{invoice.woNumber}</span> | Xe:{' '}
                <strong>{invoice.vehicle.licensePlate}</strong> ({invoice.vehicle.make}{' '}
                {invoice.vehicle.model})
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">percent</span>
                <span>Chỉnh chiết khấu</span>
              </button>

              <button
                type="button"
                onClick={handleIssue}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-dark transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Phát hành hóa đơn</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Hủy nháp</span>
              </button>
            </>
          )}

          {invoice.status === 'ISSUED' && (
            <>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Thu tiền ngay</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>In / Xuất PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Hủy hóa đơn</span>
              </button>
            </>
          )}

          {invoice.status === 'PAID' && (
            <>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-dark transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Tải biên lai / In PDF</span>
              </button>
            </>
          )}

          {invoice.status === 'CANCELLED' && (
            <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              Lý do hủy: {invoice.cancelReason || 'Không có ghi chú'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Bento Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant space-y-2 text-xs">
          <span className="font-bold text-on-surface-variant uppercase tracking-wider block">
            Khách hàng
          </span>
          <div className="text-base font-bold text-on-surface">{invoice.customer.fullName}</div>
          <div className="text-on-surface-variant">SĐT: {invoice.customer.phone || '-'}</div>
          <div className="text-on-surface-variant">Email: {invoice.customer.email || '-'}</div>
        </div>

        {/* Vehicle Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant space-y-2 text-xs">
          <span className="font-bold text-on-surface-variant uppercase tracking-wider block">
            Phương tiện
          </span>
          <div className="text-base font-bold text-on-surface font-mono">
            {invoice.vehicle.licensePlate}
          </div>
          <div className="text-on-surface-variant">
            {invoice.vehicle.make} {invoice.vehicle.model} ({invoice.vehicle.year})
          </div>
          <div className="text-on-surface-variant">Màu: {invoice.vehicle.color || '-'}</div>
        </div>

        {/* Personnel Card */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant space-y-2 text-xs">
          <span className="font-bold text-on-surface-variant uppercase tracking-wider block">
            Hồ sơ &amp; Nhân sự
          </span>
          <div>Cố vấn dịch vụ: <strong>{invoice.advisor.fullName}</strong></div>
          <div>Người lập hóa đơn: {invoice.createdBy?.full_name || '-'}</div>
          {invoice.issuedBy && <div>Người phát hành: {invoice.issuedBy.full_name}</div>}
          <div className="text-on-surface-variant pt-1 border-t border-outline-variant/60">
            Ngày tạo: {formatDate(invoice.createdAt)}
          </div>
        </div>
      </div>

      {/* 3. Lines Breakdown Table */}
      <div className="space-y-3 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-title-sm font-bold text-on-surface flex items-center gap-2">
            <span>Danh mục chi phí thanh toán ({invoice.lines.length})</span>
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">Quy chế Không Thuế (VAT 0%)</span>
        </div>

        <InvoiceLinesTable lines={invoice.lines} />

        {/* 4. Cost Totals Summary Box */}
        <div className="flex flex-col items-end pt-4 space-y-2 text-sm">
          <div className="w-80 flex justify-between text-on-surface-variant">
            <span>Tổng tiền dịch vụ (Subtotal):</span>
            <span className="font-semibold text-on-surface">{formatMoney(invoice.subtotal)}</span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="w-80 space-y-0.5">
              <div className="flex justify-between text-error font-semibold">
                <span>Chiết khấu / Giảm trừ:</span>
                <span>- {formatMoney(invoice.discountAmount)}</span>
              </div>
              {invoice.discountReason && (
                <div className="text-right text-xs text-on-surface-variant italic">
                  (Lý do: {invoice.discountReason})
                </div>
              )}
            </div>
          )}

          <div className="w-80 flex justify-between text-on-surface-variant text-xs">
            <span>Thuế GTGT (VAT 0% - Zero-Tax):</span>
            <span>0 đ</span>
          </div>

          <div className="w-80 flex justify-between text-lg font-bold text-on-surface pt-3 border-t border-outline-variant">
            <span>TỔNG THANH TOÁN:</span>
            <span className="text-primary">{formatMoney(invoice.totalAmount)}</span>
          </div>

          <div className="w-80 flex justify-between text-sm font-bold pt-1">
            <span>Số tiền còn phải trả:</span>
            {invoice.amountDue > 0 ? (
              <span className="text-amber-700 text-base">{formatMoney(invoice.amountDue)}</span>
            ) : (
              <span className="text-emerald-600 font-bold">0 đ (Đã thanh toán đủ)</span>
            )}
          </div>

          {invoice.notes && (
            <div className="w-full mt-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface">
              <span className="font-bold text-on-surface-variant block mb-0.5">Ghi chú trên hóa đơn:</span>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Payment Transaction History */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-title-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">history</span>
            <span>Lịch sử thanh toán &amp; Đối soát ({invoice.payments.length})</span>
          </h3>
          {invoice.status === 'PAID' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Đã quyết toán tài chính 100%
            </span>
          )}
        </div>

        {invoice.payments.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-4 text-center">
            Chưa có giao dịch thanh toán nào được ghi nhận.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3">Mã tham chiếu / Chuẩn chi</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3 text-right">Tiền khách đưa</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono">{formatDate(p.paidAt || p.createdAt)}</td>
                    <td className="py-2.5 px-3 font-medium">
                      {p.paymentMethod === 'CASH'
                        ? 'Tiền mặt'
                        : p.paymentMethod === 'CARD'
                        ? 'Thẻ (POS)'
                        : 'VNPay QR'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{p.transactionRef || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-on-surface">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-on-surface-variant">
                      {p.tenderedAmount ? formatMoney(p.tenderedAmount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Thành công
                        </span>
                      ) : p.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Đang chờ
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"
                          title={p.failureReason || 'Thất bại'}
                        >
                          Thất bại
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DiscountEditorModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        invoiceId={invoice.id}
        subtotal={invoice.subtotal}
        currentDiscount={invoice.discountAmount}
        currentReason={invoice.discountReason}
        onSuccess={loadInvoice}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={loadInvoice}
      />
    </div>
  );
}
