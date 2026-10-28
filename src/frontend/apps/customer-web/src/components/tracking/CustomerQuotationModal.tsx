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
  const [rejectType, setRejectType] = useState<'REVISE' | 'CANCEL'>('REVISE');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');
  const [isConfirmApproveOpen, setIsConfirmApproveOpen] = useState<boolean>(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState<boolean>(false);
  const [approveError, setApproveError] = useState<string>('');

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

  const parsedReject = (() => {
    if (!quotation.rejectReason) return null;
    try {
      const p = JSON.parse(quotation.rejectReason);
      if (p && typeof p === 'object' && p.type) return p;
      return { type: 'REVISE', reason: quotation.rejectReason };
    } catch {
      return { type: 'REVISE', reason: quotation.rejectReason };
    }
  })();

  const REVISE_PRESETS = [
    'Chi phí vượt quá ngân sách dự kiến',
    'Chỉ muốn làm trước các hạng mục thiết yếu',
    'Muốn đổi loại phụ tùng tiết kiệm / OEM hơn',
    'Muốn tham khảo thêm chính sách ưu đãi giá',
    'Cần trao đổi thêm qua điện thoại với Cố vấn',
  ];

  const CANCEL_PRESETS = [
    'Bận việc đột xuất, sẽ quay lại sau',
    'Chưa có nhu cầu sửa chữa / bảo dưỡng lúc này',
    'Thời gian thực hiện dự kiến quá lâu',
    'Mang xe về kiểm tra thêm ở nơi khác',
    'Lý do cá nhân khác',
  ];

  // Xử lý phê duyệt báo giá
  const handleExecuteApprove = async () => {
    try {
      setLoading(true);
      setApproveError('');
      await approveQuotation(quotation.id);
      setIsConfirmApproveOpen(false);
      onActionSuccess('Quý khách đã phê duyệt báo giá thành công! Kỹ thuật viên sẽ bắt đầu thực hiện.');
      onClose();
    } catch (err: any) {
      setApproveError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt báo giá');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý từ chối hoặc yêu cầu điều chỉnh báo giá
  const handleExecuteReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError(
        rejectType === 'CANCEL'
          ? 'Vui lòng chọn hoặc nhập lý do nhận lại xe để trung tâm hỗ trợ tốt nhất'
          : 'Vui lòng nhập lý do để Cố vấn hỗ trợ điều chỉnh phương án tốt nhất cho quý khách'
      );
      return;
    }

    try {
      setLoading(true);
      await rejectQuotation(quotation.id, rejectReason.trim(), rejectType);
      setIsConfirmCancelOpen(false);
      if (rejectType === 'CANCEL') {
        onActionSuccess('Đã gửi phản hồi: Hủy dịch vụ & Đăng ký nhận lại xe. Cố vấn sẽ hỗ trợ bàn giao xe cho Quý khách.');
      } else {
        onActionSuccess('Đã gửi yêu cầu điều chỉnh phương án báo giá đến Cố vấn dịch vụ.');
      }
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
            <div className={`p-4 rounded-2xl border text-xs space-y-1.5 shadow-2xs ${
              parsedReject?.type === 'CANCEL'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">
                  {parsedReject?.type === 'CANCEL' ? 'car_crash' : 'edit_note'}
                </span>
                <span>
                  {parsedReject?.type === 'CANCEL'
                    ? 'Quý khách đã từ chối dịch vụ & Yêu cầu nhận lại xe'
                    : 'Quý khách đã gửi yêu cầu điều chỉnh phương án dịch vụ'}
                </span>
              </div>
              <p className="pl-7 italic text-on-surface font-medium">
                <b>Nội dung phản hồi:</b> "{parsedReject?.reason || quotation.rejectReason}"
              </p>
              <p className="pl-7 text-[11px] opacity-80">
                {parsedReject?.type === 'CANCEL'
                  ? 'Cố vấn dịch vụ đang chuẩn bị thủ tục bàn giao xe để Quý khách nhận lại tại sảnh tiếp nhận.'
                  : 'Cố vấn dịch vụ đang xem xét và sẽ cập nhật phương án báo giá mới gửi đến Quý khách sớm nhất.'}
              </p>
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

          {/* Form phản hồi nếu khách hàng bấm Yêu cầu tư vấn lại / Từ chối */}
          {showRejectForm && (
            <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 animate-fade-in ${
              rejectType === 'REVISE'
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-rose-50/80 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className={`material-symbols-outlined text-[22px] ${
                    rejectType === 'REVISE' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {rejectType === 'REVISE' ? 'edit_note' : 'directions_car'}
                  </span>
                  <span className={rejectType === 'REVISE' ? 'text-amber-950' : 'text-rose-950'}>
                    {rejectType === 'REVISE'
                      ? 'Yêu cầu điều chỉnh phương án dịch vụ'
                      : 'Hủy dịch vụ & Đăng ký nhận lại xe'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="text-xs text-on-surface-variant hover:underline"
                >
                  Đóng lại
                </button>
              </div>

              {/* Segmented Switcher for Intent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-black/5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setRejectType('REVISE');
                    setRejectReason('');
                    setRejectError('');
                  }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all ${
                    rejectType === 'REVISE'
                      ? 'bg-white shadow-sm border border-amber-300 text-amber-950 font-bold'
                      : 'text-on-surface-variant hover:bg-white/50 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                    handyman
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">1. Muốn điều chỉnh phương án</div>
                    <div className="text-[11px] opacity-80 font-normal mt-0.5">
                      Giảm bớt hạng mục, đổi phụ tùng tiết kiệm hoặc áp dụng ưu đãi
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectType('CANCEL');
                    setRejectReason('');
                    setRejectError('');
                  }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all ${
                    rejectType === 'CANCEL'
                      ? 'bg-white shadow-sm border border-rose-300 text-rose-950 font-bold'
                      : 'text-on-surface-variant hover:bg-white/50 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5">
                    car_crash
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">2. Hủy dịch vụ & Nhận lại xe</div>
                    <div className="text-[11px] opacity-80 font-normal mt-0.5">
                      Không làm dịch vụ lần này, yêu cầu bàn giao xuất trả xe
                    </div>
                  </div>
                </button>
              </div>

              {/* Guidance text */}
              <p className="text-xs font-medium text-on-surface">
                {rejectType === 'REVISE'
                  ? 'Vui lòng chọn lý do hoặc nhập yêu cầu điều chỉnh để Cố vấn chuẩn bị báo giá mới tốt hơn:'
                  : 'Vui lòng chọn lý do hủy dịch vụ để xưởng hỗ trợ xuất trả xe chu đáo nhất:'}
              </p>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {(rejectType === 'REVISE' ? REVISE_PRESETS : CANCEL_PRESETS).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setRejectReason(reason);
                      setRejectError('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors shadow-2xs text-left border ${
                      rejectReason === reason
                        ? rejectType === 'REVISE'
                          ? 'bg-amber-200 border-amber-400 text-amber-950 font-bold'
                          : 'bg-rose-200 border-rose-400 text-rose-950 font-bold'
                        : 'bg-white hover:bg-black/5 text-on-surface border-black/10'
                    }`}
                  >
                    + {reason}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError('');
                }}
                rows={3}
                placeholder={
                  rejectType === 'REVISE'
                    ? 'Nhập chi tiết yêu cầu điều chỉnh (ví dụ: bớt gói vệ sinh buồng đốt, chỉ thay nhớt...)'
                    : 'Nhập ghi chú thêm cho Cố vấn dịch vụ...'
                }
                className="w-full p-3 rounded-xl border border-outline-variant bg-white text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {rejectError && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {rejectError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-on-surface border border-gray-300 transition-colors cursor-pointer"
                >
                  Quay lại
                </button>

                {rejectType === 'REVISE' ? (
                  <button
                    type="button"
                    onClick={handleExecuteReject}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      'Đang gửi...'
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Gửi yêu cầu điều chỉnh</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!rejectReason.trim()) {
                        setRejectError('Vui lòng chọn hoặc nhập lý do nhận lại xe');
                        return;
                      }
                      setIsConfirmCancelOpen(true);
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Xác nhận hủy dịch vụ & Nhận lại xe</span>
                  </button>
                )}
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
                  onClick={() => {
                    setApproveError('');
                    setIsConfirmApproveOpen(true);
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Đồng ý & Phê duyệt thực hiện</span>
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

      {/* ================= MODAL XÁC NHẬN PHÊ DUYỆT BÁO GIÁ ================= */}
      {isConfirmApproveOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">verified</span>
            </div>

            <div>
              <h3 className="text-title-md font-bold text-on-surface">Xác nhận phê duyệt báo giá</h3>
              <p className="text-body-xs text-on-surface-variant mt-1">
                Quý khách xác nhận đồng ý với bảng báo giá này để xưởng tiến hành thi công sửa chữa?
              </p>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 text-left space-y-2 border border-outline-variant/60 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Mã số báo giá:</span>
                <span className="font-mono font-bold text-on-surface">{quotation.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phương tiện:</span>
                <span className="font-semibold text-on-surface">{vehiclePlate} ({vehicleModel})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Cố vấn phụ trách:</span>
                <span className="font-semibold text-on-surface">{advisorName}</span>
              </div>
              <div className="border-t border-outline-variant/60 pt-2 flex justify-between items-center">
                <span className="font-bold text-on-surface">Tổng thanh toán:</span>
                <span className="font-mono font-extrabold text-base text-primary">
                  {quotation.grandTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">check</span>
              <span>Toàn bộ chi phí đã được niêm yết trọn gói, cam kết 0% VAT và không phát sinh phụ phí ngoài kế hoạch.</span>
            </div>

            {approveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left">
                {approveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setIsConfirmApproveOpen(false);
                  setApproveError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-xs transition-colors cursor-pointer"
              >
                Xem lại
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteApprove}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang phê duyệt...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Xác nhận đồng ý</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN HỦY DỊCH VỤ & NHẬN LẠI XE ================= */}
      {isConfirmCancelOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-rose-200 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">directions_car</span>
            </div>

            <div>
              <h3 className="text-title-md font-bold text-on-surface">Xác nhận hủy dịch vụ & Nhận lại xe</h3>
              <p className="text-body-xs text-on-surface-variant mt-1">
                Quý khách xác nhận không thực hiện các hạng mục dịch vụ và muốn nhận lại xe ngay hôm nay?
              </p>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 text-left space-y-2 border border-rose-200 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Phương tiện:</span>
                <span className="font-semibold text-on-surface">{vehiclePlate} ({vehicleModel})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Cố vấn phụ trách:</span>
                <span className="font-semibold text-on-surface">{advisorName}</span>
              </div>
              <div className="border-t border-rose-200 pt-2 text-[11px] text-rose-800">
                <b>Lý do ghi nhận:</b> {rejectReason}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsConfirmCancelOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container font-semibold text-xs transition-colors cursor-pointer"
              >
                Xem lại
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteReject}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Xác nhận nhận lại xe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
