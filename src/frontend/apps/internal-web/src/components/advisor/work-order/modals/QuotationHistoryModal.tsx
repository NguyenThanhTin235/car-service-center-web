'use client';

import React, { useState, useMemo } from 'react';
import { Quotation, QuotationLine, exportOrPrintQuotationPdf } from '@/lib/api/quotation.api';
import { WorkOrder } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface QuotationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  activeQuotationId: number | null;
  onSelectQuotation: (id: number) => void;
  workOrder: WorkOrder;
}

export default function QuotationHistoryModal({
  isOpen,
  onClose,
  quotations,
  activeQuotationId,
  onSelectQuotation,
  workOrder,
}: QuotationHistoryModalProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'SENT' | 'DRAFT'>('ALL');
  const [expandedQuotationIds, setExpandedQuotationIds] = useState<Record<number, boolean>>({});
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Tìm báo giá gửi cuối cùng (Báo giá chính thức)
  const latestSentQuotation = useMemo(() => {
    const sentList = quotations.filter(
      (q) => q.sentAt || ['SENT', 'APPROVED', 'REJECTED'].includes(q.status)
    );
    if (sentList.length === 0) return null;
    return [...sentList].sort((a, b) => {
      const timeA = a.sentAt ? new Date(a.sentAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.sentAt ? new Date(b.sentAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    })[0];
  }, [quotations]);

  const sentCount = useMemo(() => {
    return quotations.filter(
      (q) => q.sentAt || ['SENT', 'APPROVED', 'REJECTED'].includes(q.status)
    ).length;
  }, [quotations]);

  const draftCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'DRAFT').length;
  }, [quotations]);

  // Lọc danh sách theo tab
  const filteredQuotations = useMemo(() => {
    if (filterTab === 'SENT') {
      return quotations.filter(
        (q) => q.sentAt || ['SENT', 'APPROVED', 'REJECTED'].includes(q.status)
      );
    }
    if (filterTab === 'DRAFT') {
      return quotations.filter((q) => q.status === 'DRAFT');
    }
    return quotations;
  }, [quotations, filterTab]);

  const toggleExpand = (id: number) => {
    setExpandedQuotationIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = async (q: Quotation) => {
    try {
      setExportingId(q.id);
      toast.loading('Đang khởi tạo bản in...', { id: 'pdf-toast' });
      await exportOrPrintQuotationPdf(q.id, q.quotationNumber, 'print');
      toast.success('Đã mở xem trước bản in thành công', { id: 'pdf-toast' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xuất file PDF', { id: 'pdf-toast' });
    } finally {
      setExportingId(null);
    }
  };

  const formatVnd = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDateTime = (val?: string | null) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-primary text-white px-6 py-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[26px]">history</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-title-md font-bold">Lịch sử các phiên bản Báo giá</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 text-white">
                  {quotations.length} phiên bản
                </span>
              </div>
              <p className="text-body-xs text-white/80 mt-0.5">
                Lệnh: <span className="font-mono font-bold text-white">{workOrder.wo_number}</span> • Xe: {workOrder.vehicle.license_plate} ({workOrder.vehicle.make} {workOrder.vehicle.model})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Highlights banner & Filter tabs */}
        <div className="p-5 bg-surface-container-low border-b border-outline-variant/60 space-y-4 shrink-0">
          {/* Main quote highlight badge */}
          {latestSentQuotation ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body-xs">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px] text-emerald-600 shrink-0">
                  verified
                </span>
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Báo giá chính thức (Gửi cuối cùng cho khách):</span>
                    <span className="font-mono px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px]">
                      {latestSentQuotation.quotationNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Gửi lúc {formatDateTime(latestSentQuotation.sentAt)} • Tổng thanh toán: <b className="font-mono">{formatVnd(latestSentQuotation.grandTotal)}</b>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectQuotation(latestSentQuotation.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>Xem báo giá này</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-body-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
              <span>Chưa có báo giá nào được gửi cho khách hàng. Các bản báo giá hiện tại đều đang là <b>Bản nháp</b>.</span>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              Tất cả ({quotations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('SENT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'SENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-blue-700 dark:text-blue-400'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              Đã gửi khách ({sentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('DRAFT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'DRAFT'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              Bản nháp ({draftCount})
            </button>
          </div>
        </div>

        {/* Scrollable List of Quotations */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredQuotations.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant border border-dashed border-outline-variant rounded-2xl">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">find_in_page</span>
              <p className="font-semibold text-sm">Không có báo giá nào trong danh mục này</p>
            </div>
          ) : (
            filteredQuotations.map((q) => {
              const isMainSent = latestSentQuotation?.id === q.id;
              const isSelected = activeQuotationId === q.id;
              const isExpanded = Boolean(expandedQuotationIds[q.id]);
              const isDraft = q.status === 'DRAFT';
              const isSent = Boolean(q.sentAt || ['SENT', 'APPROVED', 'REJECTED'].includes(q.status));

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isMainSent
                      ? 'border-emerald-500/50 bg-emerald-500/[0.02] shadow-sm ring-1 ring-emerald-500/30'
                      : isSelected
                      ? 'border-primary/50 bg-primary/[0.02] shadow-sm'
                      : 'border-outline-variant/60 bg-surface-container-lowest hover:border-outline-variant'
                  }`}
                >
                  {/* Card Header & Controls */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 bg-surface-container-lowest">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-title-sm font-bold text-on-surface">
                        {q.quotationNumber}
                      </span>

                      {/* ⭐ Badge Báo giá chính (Gửi cuối cùng) */}
                      {isMainSent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                          <span className="material-symbols-outlined text-[13px]">star</span>
                          <span>Báo giá chính (Gửi cuối)</span>
                        </span>
                      )}

                      {/* Badge Đã gửi / Bản nháp */}
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
                          <span className="material-symbols-outlined text-[13px]">send</span>
                          <span>Đã gửi khách</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 border border-slate-500/20 text-slate-700 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[13px]">edit_note</span>
                          <span>Bản nháp</span>
                        </span>
                      )}

                      {/* Trạng thái duyệt */}
                      {q.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          <span>Đã phê duyệt (Đã khóa)</span>
                        </span>
                      )}
                      {q.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          <span>Khách từ chối</span>
                        </span>
                      )}

                      {/* Loại báo giá */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
                        {q.quotationType === 'PRIMARY' ? 'Chính' : 'Bổ sung'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePrint(q)}
                        disabled={exportingId === q.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="In hoặc xem bản in PDF"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">print</span>
                        <span className="hidden sm:inline">In PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Xem chi tiết các hạng mục"
                      >
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        <span>{isExpanded ? 'Thu gọn' : `Chi tiết (${q.lines?.length || 0})`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuotation(q.id);
                          onClose();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? 'bg-primary/10 text-primary border border-primary/30 pointer-events-none'
                            : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isSelected ? 'check' : 'visibility'}
                        </span>
                        <span>{isSelected ? 'Đang mở' : 'Mở xem'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary finance info */}
                  <div className="p-4 sm:p-5 bg-surface-container-lowest grid grid-cols-2 sm:grid-cols-4 gap-4 text-body-xs">
                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Tiền dịch vụ & VT:</span>
                      <span className="font-mono font-semibold text-on-surface">{formatVnd(q.subtotal)}</span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Chiết khấu:</span>
                      <span className={`font-mono font-semibold ${q.discountAmount > 0 ? 'text-amber-600' : 'text-on-surface'}`}>
                        {q.discountAmount > 0 ? `-${formatVnd(q.discountAmount)}` : '0 đ'}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Tổng thanh toán:</span>
                      <span className="font-mono font-bold text-sm text-primary">
                        {formatVnd(q.grandTotal)}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Người lập / Ngày tạo:</span>
                      <span className="font-medium text-on-surface block truncate" title={q.createdBy?.full_name}>
                        {q.createdBy?.full_name || 'Hệ thống'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">{formatDateTime(q.createdAt)}</span>
                    </div>
                  </div>

                  {/* Sent / Approved Info Bar */}
                  <div className="px-4 sm:px-5 py-2.5 bg-surface-container-low/60 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-4">
                      <span>
                        Gửi khách:{' '}
                        <b className={q.sentAt ? 'text-blue-700 dark:text-blue-400 font-mono' : 'text-slate-500 italic'}>
                          {q.sentAt ? formatDateTime(q.sentAt) : 'Chưa gửi'}
                        </b>
                      </span>

                      {q.approvedAt && (
                        <span>
                          Duyệt lúc:{' '}
                          <b className="text-emerald-700 dark:text-emerald-400 font-mono">
                            {formatDateTime(q.approvedAt)}
                          </b>{' '}
                          {q.approvedBy ? `(${q.approvedBy.full_name})` : '(Khách duyệt)'}
                        </span>
                      )}
                    </div>

                    {q.rejectReason && (
                      <div className="text-rose-600 font-medium">
                        Lý do từ chối: {q.rejectReason}
                      </div>
                    )}
                  </div>

                  {/* Expanded Item Lines Table */}
                  {isExpanded && (
                    <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/50 animate-in fade-in duration-150">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-outline-variant/50 rounded-xl overflow-hidden">
                          <thead className="bg-surface-container-high text-on-surface font-semibold text-[11px]">
                            <tr>
                              <th className="py-2 px-3 w-10 text-center">#</th>
                              <th className="py-2 px-3">Hạng mục / Phụ tùng / Tiền công</th>
                              <th className="py-2 px-3 w-24">Loại</th>
                              <th className="py-2 px-3 w-20 text-center">SL</th>
                              <th className="py-2 px-3 w-28 text-right">Đơn giá</th>
                              <th className="py-2 px-3 w-32 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30">
                            {(q.lines || []).map((line, idx) => (
                              <tr key={line.id || idx} className="hover:bg-surface-container-low/60">
                                <td className="py-2 px-3 text-center text-on-surface-variant">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-on-surface">{line.description}</div>
                                  {line.woServiceName && (
                                    <div className="text-[10px] text-primary">{line.woServiceName}</div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-surface-variant">
                                    {line.lineType === 'PACKAGE'
                                      ? 'Trọn gói'
                                      : line.lineType === 'LABOUR'
                                      ? 'Tiền công'
                                      : line.lineType === 'PART'
                                      ? 'Phụ tùng'
                                      : line.lineType}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-medium">
                                  {Number(line.quantity || 0)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-on-surface-variant">
                                  {formatVnd(line.snapshotUnitPrice)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-on-surface">
                                  {formatVnd(line.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
            <span>Báo giá gửi cuối cùng cho khách hàng được tự động xác định là <b>Báo giá chính thức</b> phục vụ theo dõi và thi công.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-outline-variant transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
