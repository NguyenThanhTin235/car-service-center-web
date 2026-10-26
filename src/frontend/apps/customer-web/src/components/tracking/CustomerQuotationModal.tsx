'use client';

import React, { useState } from 'react';
import { approveQuotation, rejectQuotation, downloadQuotationPdf } from '@/lib/api/quotation.api';

interface CustomerQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: {
    id: number;
    quotationNumber: string;
    quotationType: string;
    version: number;
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    subtotal: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    rejectReason?: string | null;
    sentAt?: string | null;
    approvedAt?: string | null;
    createdAt: string;
    lines: Array<{
      id: number;
      lineType: 'LABOUR' | 'PART';
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      sortOrder: number;
    }>;
  };
  advisorName: string;
  vehiclePlate: string;
  vehicleModel: string;
  onActionSuccess: (msg: string) => void;
}

export default function CustomerQuotationModal({
  isOpen,
  onClose,
  quotation,
  advisorName,
  vehiclePlate,
  vehicleModel,
  onActionSuccess,
}: CustomerQuotationModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');

  if (!isOpen) return null;

  const labourLines = quotation.lines.filter((l) => l.lineType === 'LABOUR');
  const partLines = quotation.lines.filter((l) => l.lineType === 'PART');

  const totalLabour = labourLines.reduce((acc, l) => acc + l.amount, 0);
  const totalParts = partLines.reduce((acc, l) => acc + l.amount, 0);

  const normalizeVehicleSizeDescription = (text: string) => {
    if (!text) return '';
    return text
      .replace(/Phân khúc xe:\s*SMALL/gi, 'Phân khúc xe: Cỡ nhỏ')
      .replace(/Phân khúc xe:\s*MEDIUM/gi, 'Phân khúc xe: Cỡ vừa')
      .replace(/Phân khúc xe:\s*LARGE/gi, 'Phân khúc xe: Cỡ lớn')
      .replace(/Phân khúc xe:\s*SUV/gi, 'Phân khúc xe: SUV / Crossover')
      .replace(/Phân khúc xe:\s*TRUCK/gi, 'Phân khúc xe: Bán tải');
  };

  // Xử lý duyệt báo giá
  const handleApprove = async () => {
    if (!window.confirm('Quý khách xác nhận đồng ý với bảng báo giá này để xưởng tiến hành thực hiện?')) {
      return;
    }

    try {
      setLoading(true);
      await approveQuotation(quotation.id);
      onActionSuccess('Quý khách đã phê duyệt báo giá thành công! Kỹ thuật viên sẽ bắt đầu thực hiện.');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt báo giá');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý từ chối báo giá
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do để Cố vấn hỗ trợ điều chỉnh phương án tốt nhất cho quý khách');
      return;
    }

    try {
      setLoading(true);
      await rejectQuotation(quotation.id, rejectReason.trim());
      onActionSuccess('Đã gửi phản hồi từ chối báo giá. Cố vấn dịch vụ sẽ sớm liên hệ lại với quý khách.');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi phản hồi');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tải PDF
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadQuotationPdf(quotation.id, quotation.quotationNumber);
    } catch (err: any) {
      alert('Không thể tải file PDF lúc này, vui lòng thử lại sau.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusBadge = () => {
    switch (quotation.status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ Quý khách phê duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Đã được phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Đã từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
            {quotation.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-surface-container-highest flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ================= Header ================= */}
        <div className="p-5 sm:p-6 border-b border-surface-container-highest bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-primary border border-blue-200">
                #{quotation.quotationNumber}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-surface-container text-on-surface-variant">
                Phiên bản v{quotation.version}
              </span>
              {getStatusBadge()}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              Bảng Báo Giá Chi Tiết Dịch Vụ
            </h2>
            <div className="text-xs sm:text-sm text-on-surface-variant flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <span>
                Phương tiện: <strong className="text-on-surface font-mono">{vehiclePlate}</strong> ({vehicleModel})
              </span>
              <span>•</span>
              <span>
                Cố vấn dịch vụ: <strong className="text-on-surface">{advisorName}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* ================= Scrollable Body ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Alert nếu đã từ chối */}
          {quotation.status === 'REJECTED' && quotation.rejectReason && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[18px]">info</span>
                Lý do từ chối trước đó:
              </div>
              <p className="pl-6 italic">{quotation.rejectReason}</p>
            </div>
          )}

          {/* 1. Phần Tiền Công Kỹ Thuật (Fixed Labour) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Tiền công kỹ thuật & dịch vụ trọn gói</h3>
                  <p className="text-[11px] text-on-surface-variant">Chi phí khoán trọn gói cố định theo tiêu chuẩn quy trình</p>
                </div>
              </div>
              <span className="text-xs font-bold text-on-surface font-mono">
                {totalLabour.toLocaleString()} đ
              </span>
            </div>

            {labourLines.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-2">Không có hạng mục tiền công riêng biệt</p>
            ) : (
              <div className="overflow-x-auto border border-surface-container-highest rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-highest">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 font-semibold">Nội dung công việc kỹ thuật</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">Số lượng</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Đơn giá trọn gói</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest bg-surface-container-lowest">
                    {labourLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-surface-container-low/50">
                        <td className="py-2.5 px-3 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-on-surface">{normalizeVehicleSizeDescription(line.description)}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">{line.unitPrice.toLocaleString()} đ</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-on-surface">{line.amount.toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Phần Phụ Tùng & Vật Tư Chính Hãng (100% Genuine Warehouse Parts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  B
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Phụ tùng & vật tư chính hãng xuất kho</h3>
                  <p className="text-[11px] text-on-surface-variant">100% linh kiện chính hãng, bảo hành theo quy chuẩn</p>
                </div>
              </div>
              <span className="text-xs font-bold text-on-surface font-mono">
                {totalParts.toLocaleString()} đ
              </span>
            </div>

            {partLines.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-2">Không sử dụng phụ tùng thay thế</p>
            ) : (
              <div className="overflow-x-auto border border-surface-container-highest rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-highest">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 font-semibold">Tên phụ tùng / Vật tư</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">Số lượng</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Đơn giá niêm yết</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest bg-surface-container-lowest">
                    {partLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-surface-container-low/50">
                        <td className="py-2.5 px-3 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-on-surface">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                            <span>{line.description}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">{line.unitPrice.toLocaleString()} đ</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-on-surface">{line.amount.toLocaleString()} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Bảng Tổng Kết Tài Chính Chuẩn Zero-Tax */}
          <div className="bg-gradient-to-br from-surface-container-low to-blue-50/30 p-4 sm:p-5 rounded-2xl border border-surface-container-highest space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Tổng kết chi phí dịch vụ
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Tổng chi phí dịch vụ & phụ tùng (Tạm tính):</span>
                <span className="font-mono font-semibold text-on-surface">{quotation.subtotal.toLocaleString()} đ</span>
              </div>

              {quotation.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">loyalty</span>
                    Chiết khấu ưu đãi:
                  </span>
                  <span className="font-mono font-bold">-{quotation.discountAmount.toLocaleString()} đ</span>
                </div>
              )}

              {/* Zero-Tax policy badge */}
              <div className="flex items-center justify-between text-on-surface-variant pt-1 border-t border-surface-container-high/60">
                <span className="flex items-center gap-1">
                  Thuế giá trị gia tăng (VAT 0%):
                  <span className="text-[10px] text-primary bg-blue-100 px-1.5 py-0.2 rounded font-semibold">
                    Chính sách miễn thuế
                  </span>
                </span>
                <span className="font-mono font-medium text-on-surface-variant">0 đ</span>
              </div>

              {/* Grand Total */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-primary/20 text-base sm:text-lg">
                <span className="font-extrabold text-on-surface">
                  TỔNG CỘNG THANH TOÁN DỰ KIẾN:
                </span>
                <span className="font-mono font-extrabold text-primary text-xl sm:text-2xl">
                  {quotation.grandTotal.toLocaleString()} đ
                </span>
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant italic pt-1">
              * Cam kết minh bạch: Trung tâm không thu bất kỳ khoản thuế hay phụ phí phát sinh nào ngoài các hạng mục đã được quý khách đồng ý trong bảng báo giá này.
            </p>
          </div>

          {/* Form từ chối nếu khách hàng bấm Từ chối */}
          {showRejectForm && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">contact_support</span>
                  Gửi yêu cầu điều chỉnh / Từ chối báo giá
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs text-amber-800 hover:underline"
                >
                  Hủy thao tác
                </button>
              </div>

              <p className="text-xs text-amber-800">
                Vui lòng cho Cố vấn dịch vụ biết lý do quý khách chưa hài lòng hoặc muốn điều chỉnh hạng mục nào:
              </p>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Chi phí vượt dự tính ban đầu',
                  'Chỉ muốn làm trước các hạng mục thiết yếu',
                  'Muốn đổi loại phụ tùng tiết kiệm hơn',
                  'Cần trao đổi thêm qua điện thoại với Cố vấn',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setRejectReason(reason);
                      setRejectError('');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors shadow-2xs text-left"
                  >
                    + {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError('');
                }}
                rows={3}
                placeholder="Nhập ghi chú chi tiết cho Cố vấn..."
                className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {rejectError && (
                <p className="text-xs text-error font-medium">{rejectError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-on-surface border border-gray-300 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Xác nhận từ chối báo giá'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ================= Footer Actions ================= */}
        <div className="p-4 sm:p-5 border-t border-surface-container-highest bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
          {/* Nút tải PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-lowest hover:bg-surface-container-low text-xs sm:text-sm font-semibold text-on-surface transition-colors shadow-2xs"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary ${downloadingPdf ? 'animate-spin' : ''}`}>
              {downloadingPdf ? 'progress_activity' : 'picture_as_pdf'}
            </span>
            <span>{downloadingPdf ? 'Đang xuất PDF...' : 'Tải file PDF báo giá'}</span>
          </button>

          {/* Nhóm nút duyệt / từ chối */}
          <div className="flex items-center gap-2">
            {quotation.status === 'SENT' && !showRejectForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Yêu cầu tư vấn lại / Từ chối
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{loading ? 'Đang xử lý...' : 'Đồng ý & Phê duyệt thực hiện'}</span>
                </button>
              </>
            )}

            {quotation.status !== 'SENT' && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
