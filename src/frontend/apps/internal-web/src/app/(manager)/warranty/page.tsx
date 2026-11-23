'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import warrantyApi, {
  GoodwillClaimItem,
  GoodwillClaimDetailResponse,
} from '@/lib/api/warranty.api';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

export default function GoodwillClaimsPage() {
  const [claims, setClaims] = useState<GoodwillClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'PENDING'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Detail / Approval Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<GoodwillClaimDetailResponse | null>(null);
  const [claimDetailLoading, setClaimDetailLoading] = useState(false);
  const [supportType, setSupportType] = useState<'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE'>('FULL');
  const [supportPct, setSupportPct] = useState<number>(50);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadClaims = useCallback(
    async (targetPage = page) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await warrantyApi.listGoodwillClaims(
          {
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            search: debouncedSearch.trim() || undefined,
            page: targetPage,
            limit: 10,
          },
          controller.signal
        );
        if (controller.signal.aborted) return;
        setClaims(res?.claims || []);
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      } catch (err: any) {
        if (
          controller.signal.aborted ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED'
        ) {
          return;
        }
        const msg =
          err.response?.data?.message || 'Lỗi khi tải danh sách hồ sơ thiện chí.';
        setErrorMsg(msg);
        toast.error(msg);
        setClaims([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [statusFilter, debouncedSearch, page]
  );

  useEffect(() => {
    loadClaims(page);
    return () => {
      abortRef.current?.abort();
    };
  }, [loadClaims, page]);

  const handleOpenDetail = async (claimId: number) => {
    setIsDetailOpen(true);
    setSelectedDetail(null);
    setClaimDetailLoading(true);
    try {
      const data = await warrantyApi.getGoodwillClaimDetail(claimId);
      setSelectedDetail(data);
      const claim = data.claim;
      setSupportType(claim.support_type || 'FULL');
      setSupportPct(claim.support_pct || 50);
      setApprovalNote(claim.approval_note || '');
      setRejectionReason(claim.status === 'REJECTED' ? claim.approval_note || '' : '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải chi tiết thẩm định hồ sơ.');
      setIsDetailOpen(false);
    } finally {
      setClaimDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedDetail(null);
  };

  const handleApprove = async () => {
    if (!selectedDetail?.claim) return;
    if (!approvalNote.trim()) {
      toast.error('Vui lòng nhập lý do giải trình phê duyệt (bắt buộc).');
      return;
    }

    setActionLoading(true);
    try {
      await warrantyApi.approveGoodwillClaim(selectedDetail.claim.id, {
        supportType,
        supportPct: supportType === 'PERCENTAGE' ? Number(supportPct) : undefined,
        approvalNote: approvalNote.trim(),
      });
      toast.success('Phê duyệt bảo hành thiện chí thành công!');
      handleCloseDetail();
      loadClaims(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi phê duyệt hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDetail?.claim) return;
    const note = rejectionReason.trim() || approvalNote.trim();
    if (!note) {
      toast.error('Vui lòng nhập lý do từ chối hỗ trợ.');
      return;
    }

    setActionLoading(true);
    try {
      await warrantyApi.rejectGoodwillClaim(selectedDetail.claim.id, {
        approvalNote: note,
      });
      toast.success('Đã từ chối hỗ trợ thiện chí.');
      handleCloseDetail();
      loadClaims(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi từ chối hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedClaim = selectedDetail?.claim;
  const customerStats = selectedDetail?.customerStats;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Thẩm định & Duyệt Bảo hành Thiện chí (UC-86)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Xét duyệt hỗ trợ đặc biệt đối với các xe bảo hành quá hạn nhẹ (≤ 30 ngày hoặc ≤ 1.000 km).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadClaims(page)}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin text-[#0050cd]' : ''}`}>
            sync
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'APPROVED', label: 'Đã duyệt' },
            { key: 'REJECTED', label: 'Từ chối' },
            { key: 'ALL', label: 'Tất cả' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key as any);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo biển số, tên khách, số WO..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* 4-State Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : errorMsg ? (
          <div role="alert" className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <div className="text-sm font-bold text-slate-900">Không thể tải hồ sơ thiện chí</div>
            <p className="text-xs text-slate-500">{errorMsg}</p>
            <button
              type="button"
              onClick={() => loadClaims(page)}
              className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
              inventory_2
            </span>
            <h3 className="text-sm font-bold text-slate-800">Không có hồ sơ nào</h3>
            <p className="text-xs text-slate-500 mt-1">
              Chưa có đề xuất bảo hành thiện chí nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mã hồ sơ</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phương tiện</th>
                    <th className="py-3 px-4">Phiếu gốc</th>
                    <th className="py-3 px-4">Hiện tượng sự cố</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        #GC-{claim.id}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {claim.customer?.full_name || '—'}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {claim.customer?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                          {claim.vehicle?.license_plate || '—'}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {claim.vehicle?.make} {claim.vehicle?.model}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0050cd]">
                        {claim.parent_wo?.wo_number || `#${claim.parent_wo_id}`}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={claim.complaint}>
                        {claim.complaint}
                      </td>
                      <td className="py-3.5 px-4">
                        {claim.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Chờ duyệt
                          </span>
                        )}
                        {claim.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã duyệt
                          </span>
                        )}
                        {claim.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Từ chối
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(claim.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                        >
                          {claim.status === 'PENDING' ? 'Thẩm định & Duyệt' : 'Xem chi tiết'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.total > 0 && (
              <TablePagination
                currentPage={pagination.page}
                totalPages={Math.max(1, pagination.totalPages)}
                totalRecords={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            )}
          </>
        )}
      </div>

      {/* MODAL THẨM ĐỊNH TOÀN DIỆN & PHÊ DUYỆT (UC-86) */}
      <Modal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        title={
          selectedClaim
            ? `Hồ sơ Thẩm định Thiện chí: #GC-${selectedClaim.id}`
            : 'Đang tải hồ sơ thẩm định...'
        }
        size="lg"
      >
        {claimDetailLoading || !selectedClaim ? (
          <div className="space-y-4 py-4">
            <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Customer Profile & Service Visits Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-amber-600">person</span>
                Hồ sơ khách hàng & Mức độ trung thành
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block">Khách hàng:</span>
                  <strong className="text-slate-900 text-sm">
                    {selectedClaim.customer?.full_name || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedClaim.customer?.phone || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Số lần hoàn tất dịch vụ:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold font-mono tabular-nums inline-flex items-center gap-1 mt-0.5">
                    {customerStats?.totalCompletedOrders ?? 0} lần
                    {customerStats?.isLoyalCustomer && ' (Thân thiết)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fault & Overdue Info */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block">Phiếu gốc:</span>
                  <strong className="font-mono text-[#0050cd]">
                    {selectedClaim.parent_wo?.wo_number || `#${selectedClaim.parent_wo_id}`}
                  </strong>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="text-amber-700 block">Quá hạn thời gian:</span>
                  <strong className="font-mono text-amber-900">
                    {selectedClaim.overdue_days ?? 0} ngày
                  </strong>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <span className="text-amber-700 block">Quá hạn số km:</span>
                  <strong className="font-mono text-amber-900">
                    {(selectedClaim.overdue_km ?? 0).toLocaleString('vi-VN')} km
                  </strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Hiện tượng sự cố & Lý do đề xuất thiện chí:
                </label>
                <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 whitespace-pre-line">
                  {selectedClaim.complaint}
                </div>
              </div>
            </div>

            {/* Decision Section */}
            {selectedClaim.status === 'PENDING' ? (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Quyết định phê duyệt của Quản lý dịch vụ
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Chọn mức độ hỗ trợ thiện chí:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        value: 'FULL' as const,
                        title: 'Hỗ trợ 100%',
                        desc: 'Miễn phí toàn bộ cả tiền công và phụ tùng',
                      },
                      {
                        value: 'LABOUR_ONLY' as const,
                        title: 'Hỗ trợ tiền công',
                        desc: 'Miễn phí tiền công, tính tiền phụ tùng',
                      },
                      {
                        value: 'PERCENTAGE' as const,
                        title: 'Tỷ lệ giảm trừ (%)',
                        desc: 'Giảm theo tỷ lệ phần trăm nhất định',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                          supportType === opt.value
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="supportType"
                            checked={supportType === opt.value}
                            onChange={() => setSupportType(opt.value)}
                            className="text-emerald-600"
                          />
                          <span className="font-bold text-xs">{opt.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">{opt.desc}</span>
                      </label>
                    ))}
                  </div>

                  {supportType === 'PERCENTAGE' && (
                    <div className="mt-3 flex items-center gap-3">
                      <label htmlFor="goodwill-support-pct" className="text-xs font-semibold text-slate-700">
                        Tỷ lệ giảm trừ:
                      </label>
                      <input
                        id="goodwill-support-pct"
                        type="number"
                        min={1}
                        max={100}
                        value={supportPct}
                        onChange={(e) => setSupportPct(Number(e.target.value))}
                        className="w-24 p-2 border border-slate-300 rounded-lg text-xs font-bold font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="goodwill-approval-note" className="block text-xs font-bold text-slate-800 mb-1">
                    Ghi chú phê duyệt (nếu duyệt) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="goodwill-approval-note"
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Nhập căn cứ phê duyệt hoặc chỉ đạo kỹ thuật..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="goodwill-reject-note" className="block text-xs font-bold text-rose-800 mb-1">
                    Lý do từ chối (bắt buộc nếu nhấn Từ chối)
                  </label>
                  <textarea
                    id="goodwill-reject-note"
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối để nhân viên giải thích với khách hàng..."
                    className="w-full p-2.5 border border-rose-200 bg-rose-50/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">
                  Kết quả xử lý:{' '}
                  {selectedClaim.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                  {selectedClaim.status === 'APPROVED' && selectedClaim.support_type && (
                    <span className="ml-2 font-mono text-emerald-700">
                      (
                      {selectedClaim.support_type === 'FULL'
                        ? '100%'
                        : selectedClaim.support_type === 'LABOUR_ONLY'
                        ? 'Miễn công'
                        : `Giảm ${selectedClaim.support_pct}%`}
                      )
                    </span>
                  )}
                </div>
                {selectedClaim.approval_note && (
                  <p className="text-xs text-slate-600">
                    <strong>Ghi chú quyết định:</strong> {selectedClaim.approval_note}
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>

              {selectedClaim.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Đang xử lý...' : 'Phê duyệt hỗ trợ'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
