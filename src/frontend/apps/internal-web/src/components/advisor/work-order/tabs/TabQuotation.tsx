'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Quotation,
  QuotationLine,
  getWOQuotations,
  createQuotation,
  updateQuotation,
  sendQuotation,
  approveQuotation,
  rejectQuotation,
  cancelQuotation,
  exportOrPrintQuotationPdf,
} from '@/lib/api/quotation.api';
import { WorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import QuotationHistoryModal from '../modals/QuotationHistoryModal';
import VehicleReturnModal from '../modals/VehicleReturnModal';

interface TabQuotationProps {
  workOrder: WorkOrder;
  refetchWO: () => void;
  isReadOnly?: boolean;
  setActiveTab?: (tabId: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  DRAFT: { label: 'Bản nháp', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: 'edit_note' },
  SENT: { label: 'Chờ khách duyệt', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', icon: 'send' },
  APPROVED: { label: 'Đã phê duyệt (Đã khóa)', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', icon: 'check_circle' },
  REJECTED: { label: 'Khách từ chối', bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-400', icon: 'cancel' },
};

export default function TabQuotation({ workOrder, refetchWO, isReadOnly = false, setActiveTab }: TabQuotationProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeQuotationId, setActiveQuotationId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Modals
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVehicleReturnModalOpen, setIsVehicleReturnModalOpen] = useState(false);

  const fetchQuotations = useCallback(async () => {
    if (!workOrder?.id) return;
    try {
      setLoading(true);
      const res = await getWOQuotations(workOrder.id);
      if (res.success && res.data) {
        setQuotations(res.data);
        if (res.data.length > 0) {
          // Mặc định chọn Báo giá chính (gửi cuối cùng), hoặc báo giá đầu tiên
          const mainQ = res.data.find((q) => q.isLatestSent) || res.data[0];
          setActiveQuotationId((prev) => {
            const exists = res.data.some((q) => q.id === prev);
            return exists ? prev : mainQ.id;
          });
        } else {
          setActiveQuotationId(null);
        }
      }
    } catch (err: any) {
      console.error('Lỗi tải báo giá:', err);
      toast.error('Không thể tải danh sách báo giá');
    } finally {
      setLoading(false);
    }
  }, [workOrder?.id]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Báo giá chính (báo giá gửi cuối cùng hoặc báo giá đầu tiên)
  const mainQuotation = useMemo(() => {
    return quotations.find((q) => q.isLatestSent) || quotations[0] || null;
  }, [quotations]);

  const activeQuotation = useMemo(() => {
    return quotations.find((q) => q.id === activeQuotationId) || mainQuotation || null;
  }, [quotations, activeQuotationId, mainQuotation]);

  const parsedReject = useMemo(() => {
    if (!activeQuotation?.rejectReason) return null;
    if (activeQuotation.rejectDetails) return activeQuotation.rejectDetails;
    try {
      const p = JSON.parse(activeQuotation.rejectReason);
      if (p && typeof p === 'object' && p.type) return p;
      return { type: 'REVISE' as const, reason: activeQuotation.rejectReason };
    } catch {
      return { type: 'REVISE' as const, reason: activeQuotation.rejectReason };
    }
  }, [activeQuotation]);

  // Phân nhóm dòng theo Service
  const groupedLines = useMemo(() => {
    if (!activeQuotation?.lines) return {};
    const groups: Record<string, QuotationLine[]> = {};
    for (const line of activeQuotation.lines) {
      const groupName = line.woServiceName || 'Hạng mục chung';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(line);
    }
    return groups;
  }, [activeQuotation]);

  // Handler: Tạo báo giá từ Kế hoạch (UC-37)
  const handleCreateQuotation = async (type: 'PRIMARY' | 'SUPPLEMENTARY' = 'PRIMARY') => {
    try {
      setActionLoading(true);
      const res = await createQuotation(workOrder.id, {
        quotationType: type,
        parentQuotationId: type === 'SUPPLEMENTARY' && activeQuotation ? activeQuotation.id : undefined,
      });
      if (res.success && res.data) {
        if (res.data.isDuplicate) {
          toast(res.data.duplicateMessage || `Nội dung kế hoạch trùng khớp với báo giá ${res.data.quotationNumber}. Đã mở lại báo giá này.`, {
            icon: 'ℹ️',
            duration: 4500,
          });
        } else {
          toast.success(`Đã tạo ${type === 'PRIMARY' ? 'báo giá chính' : 'báo giá bổ sung'} thành công`);
        }
        await fetchQuotations();
        setActiveQuotationId(res.data.id);
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi tạo báo giá');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Gửi báo giá cho khách (UC-37 / UC-39)
  const handleSendQuotation = async () => {
    if (!activeQuotation) return;
    try {
      setActionLoading(true);
      const res = await sendQuotation(activeQuotation.id);
      if (res.success) {
        toast.success('Đã gửi báo giá đến khách hàng thành công');
        await fetchQuotations();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi gửi báo giá');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi gửi báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Khách hàng đồng ý (Duyệt) (UC-39)
  const handleApproveQuotation = async () => {
    if (!activeQuotation) return;
    try {
      setActionLoading(true);
      const res = await approveQuotation(activeQuotation.id);
      if (res.success) {
        toast.success('Báo giá đã được phê duyệt thành công! Phụ tùng đã chuyển sang trạng thái Giữ hàng.');
        await fetchQuotations();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi duyệt báo giá');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi duyệt báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Khách hàng từ chối (UC-39)
  const handleRejectQuotation = async () => {
    if (!activeQuotation) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do khách hàng từ chối');
      return;
    }
    try {
      setActionLoading(true);
      const res = await rejectQuotation(activeQuotation.id, rejectReason);
      if (res.success) {
        toast.success('Đã ghi nhận từ chối báo giá. Phiếu công việc chuyển về Lập kế hoạch.');
        setIsRejectModalOpen(false);
        setRejectReason('');
        await fetchQuotations();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi từ chối báo giá');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi từ chối báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Hủy báo giá nháp (UC-40)
  const handleCancelQuotation = async () => {
    if (!activeQuotation) return;
    try {
      setActionLoading(true);
      const res = await cancelQuotation(activeQuotation.id);
      if (res.success) {
        toast.success('Đã hủy báo giá nháp thành công');
        setIsConfirmCancelOpen(false);
        await fetchQuotations();
        refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi hủy báo giá');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi hủy báo giá');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Cập nhật chiết khấu (UC-39)
  const handleSaveDiscount = async () => {
    if (!activeQuotation) return;
    try {
      setActionLoading(true);
      const payload =
        discountType === 'percent'
          ? { discountPercent: discountValue }
          : { discountAmount: discountValue };

      const res = await updateQuotation(activeQuotation.id, payload);
      if (res.success) {
        toast.success('Đã cập nhật chiết khấu thành công');
        setIsDiscountModalOpen(false);
        await fetchQuotations();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật chiết khấu');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi cập nhật chiết khấu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportPdf = async (action: 'print' | 'download' = 'print') => {
    if (!activeQuotation) return;
    try {
      setIsExportingPdf(true);
      toast.loading(action === 'print' ? 'Đang khởi tạo bản in báo giá...' : 'Đang tải file PDF...', { id: 'pdf-toast' });
      await exportOrPrintQuotationPdf(activeQuotation.id, activeQuotation.quotationNumber, action);
      toast.success(action === 'print' ? 'Đã mở xem trước bản in thành công' : 'Đã tải file PDF báo giá thành công', { id: 'pdf-toast' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xuất file PDF', { id: 'pdf-toast' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const formatVnd = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const normalizeVehicleSizeDescription = (text: string) => {
    if (!text) return '';
    return text
      .replace(/Phân khúc xe:\s*SMALL/gi, 'Phân khúc xe: Cỡ nhỏ')
      .replace(/Phân khúc xe:\s*MEDIUM/gi, 'Phân khúc xe: Cỡ vừa')
      .replace(/Phân khúc xe:\s*LARGE/gi, 'Phân khúc xe: Cỡ lớn')
      .replace(/Phân khúc xe:\s*SUV/gi, 'Phân khúc xe: SUV / Crossover')
      .replace(/Phân khúc xe:\s*TRUCK/gi, 'Phân khúc xe: Bán tải');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
      </div>
    );
  }

  // Trường hợp chưa có bất kỳ Báo giá nào
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <span className="material-symbols-outlined text-[32px]">request_quote</span>
        </div>
        <h3 className="text-title-lg font-bold text-on-surface">Chưa có Báo giá cho Phiếu này</h3>
        <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
          Hệ thống sẽ tự động bóc tách chi phí tiền công cố định và phụ tùng xuất kho từ các dịch vụ đã lên kế hoạch để lập Báo giá chính thức.
        </p>

        {!isReadOnly && (
          <button
            onClick={() => handleCreateQuotation('PRIMARY')}
            disabled={actionLoading}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            {actionLoading ? 'Đang khởi tạo...' : 'Tạo Báo giá từ kế hoạch'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Version Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-2xs">
        {/* Version Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Nút mở Lịch sử báo giá */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-primary rounded-lg text-xs font-bold transition-all whitespace-nowrap border border-primary/20 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
            title="Xem lịch sử toàn bộ các phiên bản báo giá"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Lịch sử ({quotations.length})</span>
          </button>

          {/* Báo giá chính */}
          {mainQuotation && (
            <button
              type="button"
              onClick={() => setActiveQuotationId(mainQuotation.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeQuotation?.id === mainQuotation.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="font-mono">{mainQuotation.quotationNumber}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 ${
                  activeQuotation?.id === mainQuotation.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                }`}
                title="Báo giá gửi cuối cùng cho khách hàng (Báo giá chính)"
              >
                <span className="material-symbols-outlined text-[11px]">star</span>
                <span>Chính</span>
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                  activeQuotation?.id === mainQuotation.id
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container-highest text-on-surface'
                }`}
              >
                {mainQuotation.status === 'DRAFT'
                  ? 'Nháp'
                  : mainQuotation.status === 'SENT'
                  ? 'Đã gửi'
                  : mainQuotation.status === 'APPROVED'
                  ? 'Đã duyệt'
                  : 'Từ chối'}
              </span>
            </button>
          )}

          {/* Nếu đang xem một bản cũ từ Modal lịch sử */}
          {activeQuotation && mainQuotation && activeQuotation.id !== mainQuotation.id && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold whitespace-nowrap">
              <span className="material-symbols-outlined text-[15px] text-amber-600">history</span>
              <span>Đang xem bản cũ: <b className="font-mono">{activeQuotation.quotationNumber}</b></span>
              <button
                type="button"
                onClick={() => setActiveQuotationId(mainQuotation.id)}
                className="ml-1 text-primary hover:underline font-bold cursor-pointer"
              >
                (Về bản chính)
              </button>
            </div>
          )}

          {/* Nút thêm báo giá bổ sung */}
          {!isReadOnly && activeQuotation?.status === 'APPROVED' && (
            <button
              onClick={() => handleCreateQuotation('SUPPLEMENTARY')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-primary text-primary hover:bg-primary/5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
              title="Tạo báo giá bổ sung cho các hạng mục phát sinh"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Báo giá bổ sung
            </button>
          )}
        </div>

        {/* Right Actions: Print & Download PDF */}
        <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExportPdf('print')}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-xs sm:text-sm font-semibold border border-outline-variant transition-colors disabled:opacity-50 shadow-2xs"
              title="Mở giao diện in và xem trước báo giá"
            >
              <span className={`material-symbols-outlined text-[17px] text-primary ${isExportingPdf ? 'animate-spin' : ''}`}>
                {isExportingPdf ? 'progress_activity' : 'print'}
              </span>
              <span>In / Xem trước</span>
            </button>

            <button
              onClick={() => handleExportPdf('download')}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-xs sm:text-sm font-semibold border border-outline-variant transition-colors disabled:opacity-50 shadow-2xs"
              title="Tải file PDF báo giá về máy tính"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">download</span>
              <span>Tải PDF</span>
            </button>
          </div>
        </div>



      {/* Thông báo nếu Báo giá bị từ chối */}
      {activeQuotation?.status === 'REJECTED' && (
        parsedReject?.type === 'CANCEL' ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl text-rose-950 dark:text-rose-200 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
              </div>
              <div>
                <div className="font-bold text-sm text-rose-900 dark:text-rose-100 flex items-center gap-2">
                  <span>Khách hàng từ chối làm dịch vụ & Yêu cầu nhận lại xe</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-300">
                    Hủy dịch vụ
                  </span>
                </div>
                <div className="mt-1 text-xs text-rose-800 dark:text-rose-200">
                  <b>Lý do ghi nhận:</b> <i>"{parsedReject.reason || 'Khách hàng không làm dịch vụ, yêu cầu nhận lại xe'}"</i>
                </div>
                <div className="mt-1.5 text-xs text-rose-700 dark:text-rose-300">
                  Vui lòng kiểm tra xe, đối chiếu tài sản và thực hiện thủ tục xuất trả xe để hoàn tất hồ sơ.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {workOrder.customer?.phone && (
                <a
                  href={`tel:${workOrder.customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-rose-900/40 hover:bg-rose-100 text-rose-900 dark:text-rose-100 rounded-xl text-xs font-semibold border border-rose-300 transition-colors shadow-2xs"
                  title="Gọi cho khách hàng"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Gọi khách: {workOrder.customer.phone}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsVehicleReturnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                <span>Xuất trả xe cho khách</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-2xl text-amber-950 dark:text-amber-200 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">edit_note</span>
              </div>
              <div>
                <div className="font-bold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <span>Khách hàng yêu cầu điều chỉnh phương án dịch vụ</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300">
                    Cần báo giá lại
                  </span>
                </div>
                <div className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                  <b>Ý kiến khách hàng:</b> <i>"{parsedReject?.reason || activeQuotation.rejectReason || 'Yêu cầu điều chỉnh phương án'}"</i>
                </div>
                <div className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                  Bạn có thể điều chỉnh các hạng mục dịch vụ/phụ tùng trong kế hoạch và tạo phiên bản báo giá mới để gửi lại khách.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {setActiveTab && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('job')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-amber-900/40 hover:bg-amber-100 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-semibold border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">handyman</span>
                    <span>Sửa dịch vụ (Tab 2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('parts')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-amber-900/40 hover:bg-amber-100 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-semibold border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">build_circle</span>
                    <span>Sửa phụ tùng (Tab 3)</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleCreateQuotation('PRIMARY')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Tạo báo giá mới</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* 2. Bảng bóc tách chi tiết (Itemized Table) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-container-low/40 flex items-center justify-between">
          <div className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">list_alt</span>
            Bảng chi tiết hạng mục dịch vụ & phụ tùng
          </div>
          <div className="text-xs text-on-surface-variant font-medium">
            Áp dụng quy chế: <b>Zero-Tax (Không phụ thu thuế)</b>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/60 text-xs text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low/40">
                <th className="py-3 px-4 w-14 text-center">STT</th>
                <th className="py-3 px-4">Hạng mục / Công việc / Phụ tùng</th>
                <th className="py-3 px-4 w-36">Phân loại</th>
                <th className="py-3 px-4 w-16 text-center">SL</th>
                <th className="py-3 px-4 w-36 text-right">Đơn giá khoán</th>
                <th className="py-3 px-4 w-40 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {Object.entries(groupedLines).map(([serviceName, lines], groupIdx) => {
                const groupSubtotal = lines.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

                return (
                  <React.Fragment key={serviceName}>
                    {/* Service Group Header Row - Full 6 Columns Span */}
                    <tr className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-surface-container-low/30 dark:from-blue-950/40 dark:via-indigo-950/20 border-y border-blue-200/80 dark:border-blue-900/50">
                      <td colSpan={6} className="py-2.5 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                            <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-[16px]">build</span>
                            </span>
                            <span>DỊCH VỤ {groupIdx + 1}: {serviceName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-highest/60 px-2.5 py-0.5 rounded-full">
                              {lines.length} hạng mục
                            </span>
                            <span className="text-xs font-bold font-mono text-primary">
                              {formatVnd(groupSubtotal)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Lines under this Service */}
                    {lines.map((line, lineIdx) => {
                      const isLabour = line.lineType === 'LABOUR';
                      const isPart = line.lineType === 'PART' || line.lineType === 'MATERIAL';
                      const isPackage = line.lineType === 'PACKAGE';
                      const showJobSubtext =
                        line.jobName &&
                        line.jobName.trim().toLowerCase() !== line.description.trim().toLowerCase();

                      return (
                        <tr key={line.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="py-3 px-4 text-center text-xs text-on-surface-variant font-mono font-medium">
                            {groupIdx + 1}.{lineIdx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-xs sm:text-sm text-on-surface">
                              {normalizeVehicleSizeDescription(line.description)}
                            </div>
                            {showJobSubtext && (
                              <div className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-outline">
                                  subdirectory_arrow_right
                                </span>
                                <span>Công đoạn: <strong className="font-medium text-on-surface">{line.jobName}</strong></span>
                              </div>
                            )}
                            {line.partItem?.sku && (
                              <div className="text-[11px] font-mono text-outline mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">tag</span>
                                <span>Mã SKU: <strong className="text-on-surface">{line.partItem.sku}</strong></span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                isLabour
                                  ? 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                  : isPart
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                  : isPackage
                                  ? 'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-slate-50 text-slate-800 border-slate-200/80 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isLabour ? 'engineering' : isPart ? 'inventory_2' : isPackage ? 'package_2' : 'toll'}
                              </span>
                              {isLabour ? 'Nhân công' : isPart ? 'Phụ tùng' : isPackage ? 'Trọn gói' : 'Phụ phí'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-medium text-xs text-on-surface">
                            {line.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-on-surface-variant tabular-nums">
                            {formatVnd(line.snapshotUnitPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-xs text-on-surface tabular-nums">
                            {formatVnd(line.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3. Tóm tắt tài chính Bento Box (Financial Summary) */}
        <div className="p-5 border-t border-outline-variant bg-surface-container-low/20 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
          <div className="text-xs text-on-surface-variant space-y-1">
            <div>• Giá nhân công là giá khoán trọn gói theo tiêu chuẩn, không tính lũy tiến theo giờ.</div>
            <div>• 100% phụ tùng và vật tư được xuất từ kho phụ tùng chính hãng của trung tâm.</div>
            <div>• Toàn bộ chi phí đã được niêm yết trọn gói, cam kết không phát sinh thuế hoặc phụ phí ẩn.</div>
          </div>

          <div className="w-full sm:w-80 space-y-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/80 shadow-2xs">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Tổng tiền hạng mục (Subtotal):</span>
              <span className="font-mono font-bold text-on-surface">{formatVnd(activeQuotation?.subtotal || 0)}</span>
            </div>

            <div className="flex justify-between text-xs items-center">
              <span className="text-on-surface-variant flex items-center gap-1">
                Chiết khấu / Giảm giá:
                {!isReadOnly && activeQuotation?.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      setDiscountValue(activeQuotation?.discountAmount || 0);
                      setIsDiscountModalOpen(true);
                    }}
                    className="text-primary hover:underline text-[11px] font-semibold"
                  >
                    (Sửa)
                  </button>
                )}
              </span>
              <span className="font-mono font-bold text-rose-600">
                - {formatVnd(activeQuotation?.discountAmount || 0)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Thuế GTGT (VAT 0% - Không thu):</span>
              <span className="font-mono text-emerald-600 font-semibold">0 đ</span>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex justify-between items-baseline">
              <span className="text-sm font-bold text-on-surface">TỔNG THANH TOÁN:</span>
              <span className="font-mono text-lg font-extrabold text-primary">
                {formatVnd(activeQuotation?.grandTotal || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons Bar (Theo trạng thái vòng đời) */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {/* Trạng thái DRAFT: Cho phép gửi khách hoặc hủy nháp */}
          {activeQuotation?.status === 'DRAFT' && (
            <>
              <button
                onClick={() => setIsConfirmCancelOpen(true)}
                disabled={actionLoading}
                className="px-4 py-2 border border-outline-variant text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-sm font-semibold transition-colors"
              >
                Hủy báo giá nháp
              </button>

              <button
                onClick={() => {
                  setDiscountValue(activeQuotation.discountAmount);
                  setIsDiscountModalOpen(true);
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-xl text-sm font-semibold transition-colors"
              >
                Chỉnh sửa chiết khấu
              </button>

              <button
                onClick={() => setIsSendModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {actionLoading ? 'Đang gửi...' : 'Gửi cho khách hàng duyệt'}
              </button>
            </>
          )}

          {/* Trạng thái SENT: Chờ khách duyệt hoặc Advisor xác nhận trực tiếp */}
          {activeQuotation?.status === 'SENT' && (
            <>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Khách từ chối (Nhập lý do)
              </button>

              <button
                onClick={handleApproveQuotation}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                {actionLoading ? 'Đang xác nhận...' : 'Khách đã đồng ý (Duyệt báo giá)'}
              </button>
            </>
          )}

          {/* Trạng thái APPROVED: Đã khóa giá */}
          {activeQuotation?.status === 'APPROVED' && (
            <div className="flex flex-wrap items-center justify-between gap-3 w-full bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                <span>
                  Báo giá đã được phê duyệt và khóa đơn giá. Phụ tùng đã chuyển sang trạng thái <strong>Giữ hàng (Reserved)</strong>.
                </span>
              </div>
              {workOrder.status === 'APPROVED' && setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('job')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span>Chuyển sang Tab Công việc để Bắt đầu</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Điều chỉnh chiết khấu */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-xl p-6 space-y-4">
            <h3 className="text-title-md font-bold text-on-surface">Điều chỉnh chiết khấu báo giá</h3>
            <p className="text-xs text-on-surface-variant">
              Khoản giảm trừ sẽ được khấu trừ trực tiếp vào tổng thanh toán của khách hàng.
            </p>

            <div className="flex rounded-lg bg-surface-container-low p-1 border border-outline-variant">
              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  discountType === 'amount' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant'
                }`}
              >
                Số tiền mặt (VND)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  discountType === 'percent' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant'
                }`}
              >
                Phần trăm (%)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">
                {discountType === 'amount' ? 'Số tiền giảm (VND)' : 'Tỷ lệ chiết khấu (%)'}
              </label>
              <input
                type="number"
                min={0}
                max={discountType === 'percent' ? 100 : activeQuotation?.subtotal}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveDiscount}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
              >
                Lưu chiết khấu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Khách từ chối báo giá */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant shadow-xl p-6 space-y-4">
            <h3 className="text-title-md font-bold text-rose-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Ghi nhận khách từ chối báo giá
            </h3>
            <p className="text-xs text-on-surface-variant">
              Khi từ chối, Phiếu công việc sẽ được chuyển ngược lại trạng thái <b>Lập kế hoạch (IN_PLANNING)</b> để Cố vấn thảo luận lại và điều chỉnh dịch vụ cho khách.
            </p>

            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">
                Lý do khách hàng không đồng ý <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Khách muốn bỏ bớt hạng mục thay má phanh, chi phí vượt ngân sách..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleRejectQuotation}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Xác nhận hủy báo giá nháp */}
      {isConfirmCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl border border-outline-variant shadow-xl p-6 space-y-4">
            <h3 className="text-title-md font-bold text-on-surface">Xác nhận hủy báo giá nháp?</h3>
            <p className="text-xs text-on-surface-variant">
              Bản ghi báo giá này sẽ bị xóa khỏi hệ thống. Bạn có thể tạo lại báo giá mới bất cứ lúc nào.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCancelOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-semibold"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleCancelQuotation}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Xác nhận gửi báo giá cho khách hàng */}
      {isSendModalOpen && activeQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl border border-outline-variant shadow-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">send</span>
              </div>
              <div>
                <h3 className="text-title-md font-bold text-on-surface">Gửi Báo Giá Cho Khách Hàng</h3>
                <p className="text-xs text-on-surface-variant">
                  Hệ thống sẽ gửi email kèm liên kết trực tiếp để khách hàng phê duyệt trực tuyến.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 space-y-2.5 text-xs border border-outline-variant/60">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Khách hàng:</span>
                <span className="font-bold text-on-surface">{workOrder.customer?.full_name || 'Khách hàng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Email nhận thông báo:</span>
                <span className="font-bold text-primary">{workOrder.customer?.email || 'Chưa cập nhật email'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Số điện thoại:</span>
                <span className="font-bold text-on-surface">{workOrder.customer?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Phương tiện:</span>
                <span className="font-bold text-on-surface">
                  {workOrder.vehicle?.license_plate} - {workOrder.vehicle?.make} {workOrder.vehicle?.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Mã số báo giá:</span>
                <span className="font-mono font-bold text-on-surface">{activeQuotation.quotationNumber}</span>
              </div>
              <div className="border-t border-outline-variant/60 pt-2 flex justify-between items-center">
                <span className="text-on-surface font-bold">Tổng thanh toán (0% VAT):</span>
                <span className="text-base font-extrabold text-primary font-mono">
                  {activeQuotation.grandTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {!workOrder.customer?.email && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
                <span>Khách hàng chưa có email. Khách có thể xem và duyệt trực tiếp trên cổng thông tin Khách hàng (Tracking).</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSendModalOpen(false);
                  await handleSendQuotation();
                }}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                {actionLoading ? 'Đang gửi...' : 'Xác nhận gửi báo giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ BÁO GIÁ */}
      <QuotationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        quotations={quotations}
        activeQuotationId={activeQuotationId}
        onSelectQuotation={(id) => setActiveQuotationId(id)}
        workOrder={workOrder}
      />

      {/* MODAL BÀN GIAO & XUẤT TRẢ XE */}
      <VehicleReturnModal
        isOpen={isVehicleReturnModalOpen}
        onClose={() => setIsVehicleReturnModalOpen(false)}
        workOrder={workOrder}
        refetchWO={refetchWO}
        initialReason={parsedReject?.reason}
      />
    </div>
  );
}
