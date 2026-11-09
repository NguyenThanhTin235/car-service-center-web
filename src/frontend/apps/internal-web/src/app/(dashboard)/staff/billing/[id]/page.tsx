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
import CancelInvoiceModal from '@/components/billing/CancelInvoiceModal';
import ConfirmModal from '@/components/shared/ConfirmModal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params?.id);

  const [loading, setLoading] = useState<boolean>(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isIssueConfirmOpen, setIsIssueConfirmOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [paymentPage, setPaymentPage] = useState<number>(1);

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

  const handleConfirmIssue = async () => {
    setIsIssueConfirmOpen(false);
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

  const handleConfirmCancel = async (reason: string) => {
    try {
      setActionLoading(true);
      await cancelInvoice(invoiceId, reason);
      toast.success('Đã hủy hóa đơn thành công.');
      await loadInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi hủy hóa đơn');
      throw err;
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
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <span className="material-symbols-outlined text-[40px] animate-spin text-[#0866ff]">progress_activity</span>
        <p className="text-xs font-semibold text-slate-600">Đang tải thông tin chi tiết hóa đơn...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px]">error</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy hóa đơn</h2>
        <p className="text-xs text-slate-500">{error || 'Hóa đơn không tồn tại hoặc đã bị xóa.'}</p>
        <Link
          href="/staff/billing"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-xs"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Link
              href="/staff/billing"
              className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
              title="Quay lại danh sách"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-wider">
                  {invoice.invoiceNumber}
                </h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lệnh sửa chữa (RO):{' '}
                <span className="font-mono font-bold text-[#0050cd]">{invoice.woNumber}</span> | Phương tiện:{' '}
                <strong className="font-mono text-slate-800">{invoice.vehicle.licensePlate}</strong> ({invoice.vehicle.make}{' '}
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
                className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0050cd]">percent</span>
                <span>Chỉnh chiết khấu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsIssueConfirmOpen(true)}
                disabled={actionLoading}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Phát hành hóa đơn</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={actionLoading}
                className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Thu tiền ngay</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={actionLoading}
                className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-600">download</span>
                <span>In / Xuất PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={actionLoading}
                className="h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Tải biên lai / In PDF</span>
              </button>
            </>
          )}

          {invoice.status === 'CANCELLED' && (
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              Lý do hủy: {invoice.cancelReason || 'Không có ghi chú'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Bento Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider block text-[11px]">
            Khách hàng
          </span>
          <div className="text-base font-extrabold text-slate-900">{invoice.customer.fullName}</div>
          <div className="text-slate-600 font-mono tabular-nums">SĐT: {invoice.customer.phone || '-'}</div>
          <div className="text-slate-600">Email: {invoice.customer.email || '-'}</div>
        </div>

        {/* Vehicle Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider block text-[11px]">
            Phương tiện
          </span>
          <div className="text-base font-extrabold text-slate-900 font-mono tracking-wider">
            {invoice.vehicle.licensePlate}
          </div>
          <div className="text-slate-600">
            {invoice.vehicle.make} {invoice.vehicle.model} ({invoice.vehicle.year})
          </div>
          <div className="text-slate-600">Màu: {invoice.vehicle.color || '-'}</div>
        </div>

        {/* Personnel Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider block text-[11px]">
            Hồ sơ &amp; Nhân sự
          </span>
          <div>Cố vấn dịch vụ: <strong className="text-slate-800">{invoice.advisor.fullName}</strong></div>
          <div className="text-slate-600">Người lập hóa đơn: {invoice.createdBy?.full_name || '-'}</div>
          {invoice.issuedBy && <div className="text-slate-600">Người phát hành: {invoice.issuedBy.full_name}</div>}
          <div className="text-slate-500 pt-1 border-t border-slate-100 font-mono tabular-nums">
            Ngày tạo: {formatDate(invoice.createdAt)}
          </div>
        </div>
      </div>

      {/* 3. Lines Breakdown Table */}
      <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Danh mục chi phí thanh toán ({invoice.lines.length})</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Quy chế Không Thuế (VAT 0%)
          </span>
        </div>

        <InvoiceLinesTable lines={invoice.lines} />

        {/* 4. Cost Totals Summary Box */}
        <div className="flex flex-col items-end pt-4 space-y-2 text-xs">
          <div className="w-80 flex justify-between text-slate-600">
            <span>Tổng tiền dịch vụ (Chưa giảm trừ):</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">{formatMoney(invoice.subtotal)}</span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="w-80 space-y-0.5">
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Chiết khấu / Giảm trừ:</span>
                <span className="font-mono tabular-nums">- {formatMoney(invoice.discountAmount)}</span>
              </div>
              {invoice.discountReason && (
                <div className="text-right text-[11px] text-slate-400 italic">
                  (Lý do: {invoice.discountReason})
                </div>
              )}
            </div>
          )}

          <div className="w-80 flex justify-between text-slate-500 text-[11px]">
            <span>Thuế GTGT (0% Miễn thuế):</span>
            <span className="font-mono tabular-nums">0 đ</span>
          </div>

          <div className="w-80 flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
            <span>TỔNG THANH TOÁN:</span>
            <span className="text-[#0050cd] font-mono tabular-nums">{formatMoney(invoice.totalAmount)}</span>
          </div>

          <div className="w-80 flex justify-between text-xs font-bold pt-1">
            <span>Số tiền còn phải trả:</span>
            {invoice.amountDue > 0 ? (
              <span className="text-amber-700 text-sm font-mono tabular-nums">{formatMoney(invoice.amountDue)}</span>
            ) : (
              <span className="text-emerald-600 font-bold">0 đ (Đã thanh toán đủ)</span>
            )}
          </div>

          {invoice.notes && (
            <div className="w-full mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Ghi chú trên hóa đơn:</span>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Payment Transaction History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#0050cd]">history</span>
            <span>Lịch sử thanh toán &amp; Đối soát ({invoice.payments.length})</span>
          </h3>
          {invoice.status === 'PAID' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Đã quyết toán tài chính 100%
            </span>
          )}
        </div>

        {invoice.payments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Chưa có giao dịch thanh toán nào được ghi nhận.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3">Mã tham chiếu / Chuẩn chi</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3 text-right">Tiền khách đưa</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.slice((paymentPage - 1) * 5, paymentPage * 5).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600">{formatDate(p.paidAt || p.createdAt)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {p.paymentMethod === 'CASH'
                        ? 'Tiền mặt'
                        : p.paymentMethod === 'CARD'
                          ? 'Thẻ (POS)'
                          : 'Trực tuyến (SePay)'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {p.transactionRef || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {p.tenderedAmount ? formatMoney(p.tenderedAmount) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {invoice.payments.length > 5 && (
              <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
                <span>Tổng {invoice.payments.length} giao dịch</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={paymentPage <= 1}
                    onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    disabled={paymentPage * 5 >= invoice.payments.length}
                    onClick={() => setPaymentPage((p) => p + 1)}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {invoice && (
        <>
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

          <CancelInvoiceModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleConfirmCancel}
            invoiceNumber={invoice.invoiceNumber}
          />

          <ConfirmModal
            isOpen={isIssueConfirmOpen}
            title="Xác nhận phát hành hóa đơn"
            message={`Bạn có chắc muốn phát hành chính thức hóa đơn ${invoice.invoiceNumber}? Sau khi phát hành, khách hàng có thể thanh toán và hóa đơn không thể hoàn trả trạng thái nháp.`}
            confirmText="Phát hành ngay"
            cancelText="Kiểm tra lại"
            onConfirm={handleConfirmIssue}
            onCancel={() => setIsIssueConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
}
