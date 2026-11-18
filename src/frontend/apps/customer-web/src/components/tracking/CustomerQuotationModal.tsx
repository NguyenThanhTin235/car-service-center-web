'use client';

import React, { useState, useMemo } from 'react';
import { approveQuotation, rejectQuotation, downloadQuotationPdf } from '@/lib/api/quotation.api';
import type { CustomerQuotationDto } from '@/store/slices/trackingSlice';

interface CustomerQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: CustomerQuotationDto;
  allQuotations?: CustomerQuotationDto[];
  cumulativeSummary?: {
    totalApprovedGrandTotal: number;
    totalApprovedSubtotal: number;
    totalApprovedDiscount: number;
    approvedCount: number;
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
  allQuotations = [],
  cumulativeSummary,
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

  // Danh sách toàn bộ báo giá
  const quoteList = useMemo(() => {
    if (allQuotations && allQuotations.length > 0) {
      return allQuotations;
    }
    return [quotation];
  }, [allQuotations, quotation]);

  const [selectedQuoteId, setSelectedQuoteId] = useState<number>(quotation.id);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'COMBINED'>('SINGLE');

  if (!isOpen) return null;

  // Báo giá đang xem chi tiết
  const activeQuote = quoteList.find((q) => q.id === selectedQuoteId) || quotation;

  // Thu thập toàn bộ các dòng nếu ở chế độ COMBINED
  const combinedLines = quoteList
    .filter((q) => q.status === 'APPROVED' || q.id === activeQuote.id)
    .flatMap((q) =>
      q.lines.map((l) => ({
        ...l,
        quoteNumber: q.quotationNumber,
        isApproved: q.status === 'APPROVED',
      }))
    );

  const displayLines = viewMode === 'COMBINED' ? combinedLines : activeQuote.lines;
  const packageLines = displayLines.filter((l) => l.lineType === 'PACKAGE');
  const labourLines = displayLines.filter((l) => l.lineType === 'LABOUR');
  const partLines = displayLines.filter((l) => l.lineType === 'PART');

  const totalPackage = packageLines.reduce((acc, l) => acc + l.amount, 0);
  const totalLabour = labourLines.reduce((acc, l) => acc + l.amount, 0);
  const totalParts = partLines.reduce((acc, l) => acc + l.amount, 0);

  const displaySubtotal =
    viewMode === 'COMBINED' ? totalPackage + totalLabour + totalParts : activeQuote.subtotal;
  const displayDiscount =
    viewMode === 'COMBINED'
      ? quoteList
          .filter((q) => q.status === 'APPROVED' || q.id === activeQuote.id)
          .reduce((acc, q) => acc + q.discountAmount, 0)
      : activeQuote.discountAmount;
  const displayGrandTotal = displaySubtotal - displayDiscount;

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
    if (!activeQuote.rejectReason) return null;
    try {
      const p = JSON.parse(activeQuote.rejectReason);
      if (p && typeof p === 'object' && p.type) return p;
      return { type: 'REVISE', reason: activeQuote.rejectReason };
    } catch {
      return { type: 'REVISE', reason: activeQuote.rejectReason };
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
      await approveQuotation(activeQuote.id);
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
      await rejectQuotation(activeQuote.id, rejectReason.trim(), rejectType);
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
      await downloadQuotationPdf(activeQuote.id, activeQuote.quotationNumber);
    } catch (err: any) {
      alert('Không thể tải file PDF lúc này, vui lòng thử lại sau.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            {status}
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
              {viewMode === 'COMBINED' ? (
                <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">table_chart</span>
                  Tổng hợp toàn bộ xe
                </span>
              ) : (
                <>
                  <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-blue-100 text-primary border border-blue-200">
                    #{activeQuote.quotationNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-semibold bg-surface-container text-on-surface-variant">
                    Phiên bản v{activeQuote.version}
                  </span>
                  {activeQuote.quotationType === 'SUPPLEMENTARY' && (
                    <span className="text-xs px-2 py-0.5 rounded font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Báo giá bổ sung
                    </span>
                  )}
                  {getStatusBadge(activeQuote.status)}
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {viewMode === 'COMBINED'
                ? 'Bảng Tổng Hợp Chi Phí Dịch Vụ Xe'
                : 'Bảng Báo Giá Chi Tiết Dịch Vụ'}
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* ================= Quotation Switcher Tabs (Nếu có từ 2 báo giá trở lên) ================= */}
        {quoteList.length > 1 && (
          <div className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 bg-surface-container-low border-b border-surface-container-highest overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
              Phiên bản:
            </span>
            {quoteList.map((q) => {
              const isSelected = viewMode === 'SINGLE' && selectedQuoteId === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuoteId(q.id);
                    setViewMode('SINGLE');
                    setShowRejectForm(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/60'
                  }`}
                >
                  <span className="font-mono font-bold">#{q.quotationNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : q.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : q.status === 'SENT'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {q.quotationType === 'SUPPLEMENTARY' ? 'Bổ sung' : 'Chính'} (v{q.version})
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setViewMode('COMBINED');
                setShowRejectForm(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                viewMode === 'COMBINED'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">table_chart</span>
              <span>Tổng hợp toàn bộ xe</span>
            </button>
          </div>
        )}

        {/* ================= Scrollable Body ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Thông báo phân cấp Báo giá bổ sung */}
          {viewMode === 'SINGLE' && activeQuote.quotationType === 'SUPPLEMENTARY' && (
            <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/70 text-amber-950 text-xs space-y-1 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                <span className="material-symbols-outlined text-[20px] text-amber-600">add_circle</span>
                <span>Đây là Báo giá bổ sung (phát sinh sau khi kiểm tra xe hoặc theo yêu cầu thêm)</span>
              </div>
              <p className="pl-7 text-amber-800">
                Bảng dưới đây liệt kê các hạng mục công việc và phụ tùng <b>mới phát sinh</b> cần quý khách xác nhận. 
                {cumulativeSummary && cumulativeSummary.totalApprovedGrandTotal > 0 && (
                  <span> Quý khách đã duyệt các hạng mục trước đó trị giá <b>{cumulativeSummary.totalApprovedGrandTotal.toLocaleString()} đ</b>. Nhấn tab <i>"Tổng hợp toàn bộ xe"</i> ở trên để xem đầy đủ mọi chi phí.</span>
                )}
              </p>
            </div>
          )}

          {/* Alert nếu đã từ chối */}
          {viewMode === 'SINGLE' && activeQuote.status === 'REJECTED' && activeQuote.rejectReason && (
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
                <b>Nội dung phản hồi:</b> "{parsedReject?.reason || activeQuote.rejectReason}"
              </p>
              <p className="pl-7 text-[11px] opacity-80">
                {parsedReject?.type === 'CANCEL'
                  ? 'Cố vấn dịch vụ đang chuẩn bị thủ tục bàn giao xe để Quý khách nhận lại tại sảnh tiếp nhận.'
                  : 'Cố vấn dịch vụ đang xem xét và sẽ cập nhật phương án báo giá mới gửi đến Quý khách sớm nhất.'}
              </p>
            </div>
          )}

          {/* 1. Phần Gói Dịch Vụ Kỹ Thuật (PACKAGE) */}
          {packageLines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Gói dịch vụ kỹ thuật & định kỳ</h3>
                    <p className="text-[11px] text-on-surface-variant">Chi phí trọn gói cố định theo gói tiêu chuẩn hoặc phân khúc xe</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-on-surface font-mono">
                  {totalPackage.toLocaleString()} đ
                </span>
              </div>

              <div className="overflow-x-auto border border-surface-container-highest rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-container-highest">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center">STT</th>
                      <th className="py-2.5 px-3 font-semibold">Tên gói dịch vụ trọn gói</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">Số lượng</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Đơn giá trọn gói</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-36">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest bg-surface-container-lowest">
                    {packageLines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-surface-container-low/50">
                        <td className="py-2.5 px-3 text-center text-on-surface-variant font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-on-surface">
                          {normalizeVehicleSizeDescription(line.description)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-on-surface-variant">
                          {line.unitPrice.toLocaleString()} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-on-surface">
                          {line.amount.toLocaleString()} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Phần Tiền Công Kỹ Thuật (Fixed Labour) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {packageLines.length > 0 ? 'B' : 'A'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Tiền công kỹ thuật & hạng mục khoán</h3>
                  <p className="text-[11px] text-on-surface-variant">Chi phí nhân công thợ theo thời gian và quy trình kỹ thuật</p>
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

          {/* 3. Phần Phụ Tùng & Vật Tư Chính Hãng (100% Genuine Warehouse Parts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {packageLines.length > 0 ? 'C' : 'B'}
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

          {/* 4. Bảng Tổng Kết Tài Chính Chuẩn Zero-Tax */}
          <div className="bg-gradient-to-br from-surface-container-low to-blue-50/30 p-4 sm:p-5 rounded-2xl border border-surface-container-highest space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {viewMode === 'COMBINED' ? 'Tổng kết tài chính toàn bộ đơn hàng' : 'Tổng kết chi phí đợt báo giá này'}
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Tổng chi phí dịch vụ & phụ tùng (Tạm tính):</span>
                <span className="font-mono font-semibold text-on-surface">{displaySubtotal.toLocaleString()} đ</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">loyalty</span>
                    Chiết khấu ưu đãi:
                  </span>
                  <span className="font-mono font-bold">-{displayDiscount.toLocaleString()} đ</span>
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
                  {viewMode === 'COMBINED'
                    ? 'TỔNG CHI PHÍ TOÀN BỘ ĐƠN HÀNG:'
                    : activeQuote.quotationType === 'SUPPLEMENTARY'
                    ? 'CHI PHÍ PHÁT SINH BỔ SUNG ĐỢT NÀY:'
                    : 'TỔNG CỘNG THANH TOÁN DỰ KIẾN:'}
                </span>
                <span className="font-mono font-extrabold text-primary text-xl sm:text-2xl">
                  {displayGrandTotal.toLocaleString()} đ
                </span>
              </div>

              {/* Nếu là báo giá bổ sung, hiển thị dòng cộng dồn */}
              {viewMode === 'SINGLE' && activeQuote.quotationType === 'SUPPLEMENTARY' && cumulativeSummary && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-blue-900">
                    <span>Chi phí đã duyệt trước đó ({cumulativeSummary.approvedCount} đợt):</span>
                    <span className="font-mono font-bold">{cumulativeSummary.totalApprovedGrandTotal.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between text-blue-950 font-bold border-t border-blue-200/80 pt-1">
                    <span>Tổng chi phí cả đơn sau khi duyệt đợt này:</span>
                    <span className="font-mono text-sm text-primary">
                      {(activeQuote.grandTotal + cumulativeSummary.totalApprovedGrandTotal).toLocaleString()} đ
                    </span>
                  </div>
                </div>
              )}
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
                  className="text-xs text-on-surface-variant hover:underline cursor-pointer"
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
                  className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    rejectType === 'REVISE'
                      ? 'bg-white shadow-sm border border-amber-300 text-amber-950 font-bold'
                      : 'text-on-surface-variant hover:bg-white/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                    edit_note
                  </span>
                  <div>
                    <div className="text-xs font-bold">Tôi muốn điều chỉnh báo giá</div>
                    <div className="text-[11px] font-normal opacity-80 mt-0.5">
                      Bỏ bớt dịch vụ, đổi phụ tùng hoặc thương lượng chi phí
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
                  className={`flex items-start gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    rejectType === 'CANCEL'
                      ? 'bg-white shadow-sm border border-rose-300 text-rose-950 font-bold'
                      : 'text-on-surface-variant hover:bg-white/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5">
                    no_crash
                  </span>
                  <div>
                    <div className="text-xs font-bold">Tôi muốn hủy dịch vụ & Lấy xe</div>
                    <div className="text-[11px] font-normal opacity-80 mt-0.5">
                      Không làm dịch vụ nữa, đăng ký thủ tục nhận lại xe
                    </div>
                  </div>
                </button>
              </div>

              {/* Presets chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {rejectType === 'REVISE'
                    ? 'Chọn nhanh lý do điều chỉnh hoặc trao đổi:'
                    : 'Lý do hủy dịch vụ:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(rejectType === 'REVISE' ? REVISE_PRESETS : CANCEL_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRejectReason(preset);
                        setRejectError('');
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        rejectReason === preset
                          ? rejectType === 'REVISE'
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                            : 'bg-rose-600 text-white border-rose-600 font-semibold'
                          : 'bg-white text-on-surface-variant border-surface-container-highest hover:border-outline-variant'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for custom reason */}
              <div className="space-y-1">
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder={
                    rejectType === 'REVISE'
                      ? 'Ví dụ: Nhờ Cố vấn đổi giúp mình sang bugi loại thường hoặc bớt hạng mục vệ sinh khoang máy...'
                      : 'Ghi chú thêm cho Cố vấn dịch vụ về thời gian bạn muốn nhận lại xe...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-outline-variant/80 bg-white text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {rejectError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{rejectError}</p>
                )}
              </div>

              {/* Action Buttons for Reject Form */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-black/5 cursor-pointer"
                >
                  Hủy thao tác
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (rejectType === 'CANCEL') {
                      if (!rejectReason.trim()) {
                        setRejectError('Vui lòng chọn hoặc nhập lý do nhận lại xe');
                        return;
                      }
                      setIsConfirmCancelOpen(true);
                    } else {
                      handleExecuteReject();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer ${
                    rejectType === 'REVISE'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {rejectType === 'REVISE' ? 'send' : 'directions_car'}
                  </span>
                  <span>
                    {rejectType === 'REVISE'
                      ? 'Gửi yêu cầu điều chỉnh báo giá'
                      : 'Xác nhận đăng ký nhận lại xe'}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ================= Footer ================= */}
        <div className="p-4 sm:p-5 border-t border-surface-container-highest bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Nút tải PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-lowest hover:bg-surface-container text-xs sm:text-sm font-semibold text-on-surface transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary ${downloadingPdf ? 'animate-spin' : ''}`}>
              {downloadingPdf ? 'progress_activity' : 'picture_as_pdf'}
            </span>
            <span>{downloadingPdf ? 'Đang xuất PDF...' : 'Tải file PDF báo giá'}</span>
          </button>

          {/* Nhóm nút duyệt / từ chối */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {viewMode === 'SINGLE' && activeQuote.status === 'SENT' && !showRejectForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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

            {(viewMode !== 'SINGLE' || activeQuote.status !== 'SENT') && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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
                <span className="font-mono font-bold text-on-surface">{activeQuote.quotationNumber}</span>
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
                <span className="font-bold text-on-surface">Tổng thanh toán đợt này:</span>
                <span className="font-mono font-extrabold text-base text-primary">
                  {activeQuote.grandTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] text-left flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">check</span>
              <span>Toàn bộ chi phí đã được niêm yết trọn gói, cam kết 0% VAT và không phát sinh phụ phí ngoài kế hoạch.</span>
            </div>

            {approveError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                {approveError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsConfirmApproveOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteApprove}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN HỦY DỊCH VỤ & LẤY XE ================= */}
      {isConfirmCancelOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-rose-300 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>

            <div>
              <h3 className="text-title-md font-bold text-rose-950 dark:text-rose-200">
                Xác nhận dừng dịch vụ & Nhận lại xe
              </h3>
              <p className="text-body-xs text-on-surface-variant mt-1">
                Quý khách chắc chắn muốn hủy kế hoạch sửa chữa và nhận lại phương tiện?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">info</span>
                <span>Quy trình bàn giao hoàn trả xe:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800">
                <li>Hồ sơ sửa chữa sẽ được lưu trữ với lý do hủy xe.</li>
                <li>Cố vấn dịch vụ sẽ liên hệ để quý khách kiểm tra tài sản và nhận chìa khóa.</li>
                <li>Không phát sinh chi phí nếu xe chỉ kiểm tra sơ bộ ban đầu.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsConfirmCancelOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
              >
                Xem lại
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteReject}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận nhận lại xe'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
