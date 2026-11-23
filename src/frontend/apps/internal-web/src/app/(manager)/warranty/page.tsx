'use client';

import React, { useState, useEffect, useCallback } from 'react';
import warrantyApi, { GoodwillClaimItem } from '@/lib/api/warranty.api';
import toast from 'react-hot-toast';

export default function GoodwillClaimsPage() {
  const [claims, setClaims] = useState<GoodwillClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'PENDING'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Detail / Approval Modal
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [claimDetailLoading, setClaimDetailLoading] = useState(false);
  const [supportType, setSupportType] = useState<'FULL' | 'LABOUR_ONLY' | 'PERCENTAGE'>('FULL');
  const [supportPercentage, setSupportPercentage] = useState<number>(50);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warrantyApi.listGoodwillClaims({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setClaims(data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách hồ sơ thiện chí.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleOpenDetail = async (claimId: number) => {
    setClaimDetailLoading(true);
    try {
      const data = await warrantyApi.getGoodwillClaimDetail(claimId);
      setSelectedClaim(data);
      setSupportType(data.support_type || 'FULL');
      setSupportPercentage(data.support_percentage || 50);
      setApprovalNotes(data.approval_notes || '');
      setRejectionReason(data.rejection_reason || '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải chi tiết thẩm định hồ sơ.');
    } finally {
      setClaimDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalNotes.trim()) {
      toast.error('Vui lòng nhập lý do giải trình phê duyệt (bắt buộc).');
      return;
    }

    setActionLoading(true);
    try {
      await warrantyApi.approveGoodwillClaim(selectedClaim.id, {
        supportType,
        supportPercentage: supportType === 'PERCENTAGE' ? Number(supportPercentage) : undefined,
        approvalNotes: approvalNotes.trim(),
      });
      toast.success('Phê duyệt bảo hành thiện chí thành công!');
      setSelectedClaim(null);
      loadClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi phê duyệt hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối hỗ trợ.');
      return;
    }

    setActionLoading(true);
    try {
      await warrantyApi.rejectGoodwillClaim(selectedClaim.id, {
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Đã từ chối hỗ trợ thiện chí.');
      setSelectedClaim(null);
      loadClaims();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi từ chối hồ sơ.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Phê duyệt Bảo hành thiện chí (UC-86)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Thẩm định và phê duyệt các trường hợp vượt quá hạn bảo hành tiêu chuẩn nhưng được hỗ trợ đặc biệt
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadClaims}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status segmented pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {st === 'PENDING' && 'Chờ duyệt'}
              {st === 'APPROVED' && 'Đã duyệt'}
              {st === 'REJECTED' && 'Bị từ chối'}
              {st === 'ALL' && 'Tất cả'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã, biển số, khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải danh sách hồ sơ thiện chí...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
              <span className="material-symbols-outlined text-3xl">inbox</span>
            </div>
            <p className="text-slate-800 font-bold text-sm">Không có hồ sơ nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Chưa có đề xuất bảo hành thiện chí nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
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
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {claim.claim_number}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{claim.customer?.full_name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{claim.customer?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px]">
                        {claim.vehicle?.license_plate}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {claim.vehicle?.make} {claim.vehicle?.model}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {claim.parent_work_order?.wo_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate" title={claim.fault_description}>
                      {claim.fault_description}
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
        )}
      </div>

      {/* MODAL THẨM ĐỊNH TOÀN DIỆN & PHÊ DUYỆT (UC-86) */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl">policy</span>
                <div>
                  <h3 className="text-base font-bold">
                    Hồ sơ Thẩm định Thiện chí: {selectedClaim.claim_number}
                  </h3>
                  <p className="text-xs text-amber-100">
                    Căn cứ xét duyệt chính sách chăm sóc khách hàng đặc biệt của trung tâm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {/* Customer Profile & Service Visits Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-600">person</span>
                  Hồ sơ khách hàng & Mức độ trung thành
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block">Khách hàng:</span>
                    <strong className="text-slate-900 text-sm">{selectedClaim.customer?.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Số điện thoại:</span>
                    <strong className="text-slate-900 font-mono">{selectedClaim.customer?.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Số lần làm dịch vụ tại xưởng:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold font-mono">
                      {selectedClaim.totalVisits || 3} lần
                    </span>
                  </div>
                </div>
              </div>

              {/* Fault & Justification */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Hiện tượng sự cố phản ánh:
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900">
                    {selectedClaim.fault_description}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Lý do giải trình đề xuất của nhân viên:
                  </label>
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900">
                    {selectedClaim.justification_notes}
                  </div>
                </div>
              </div>

              {/* Decision Section (For PENDING claims) */}
              {selectedClaim.status === 'PENDING' ? (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Quyết định phê duyệt của Quản lý dịch vụ
                  </div>

                  {/* 3 Support levels */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Chọn mức độ hỗ trợ thiện chí:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <label
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${supportType === 'FULL'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="supportType"
                            checked={supportType === 'FULL'}
                            onChange={() => setSupportType('FULL')}
                            className="text-emerald-600"
                          />
                          <span className="font-bold text-xs">Hỗ trợ 100%</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">
                          Miễn phí toàn bộ cả tiền công và phụ tùng
                        </span>
                      </label>

                      <label
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${supportType === 'LABOUR_ONLY'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="supportType"
                            checked={supportType === 'LABOUR_ONLY'}
                            onChange={() => setSupportType('LABOUR_ONLY')}
                            className="text-emerald-600"
                          />
                          <span className="font-bold text-xs">Hỗ trợ tiền công</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">
                          Miễn phí tiền công, tính tiền phụ tùng
                        </span>
                      </label>

                      <label
                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${supportType === 'PERCENTAGE'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="supportType"
                            checked={supportType === 'PERCENTAGE'}
                            onChange={() => setSupportType('PERCENTAGE')}
                            className="text-emerald-600"
                          />
                          <span className="font-bold text-xs">Tỷ lệ giảm trừ (%)</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">
                          Giảm theo tỷ lệ phần trăm nhất định
                        </span>
                      </label>
                    </div>

                    {supportType === 'PERCENTAGE' && (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-700">Tỷ lệ giảm trừ:</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={supportPercentage}
                          onChange={(e) => setSupportPercentage(Number(e.target.value))}
                          className="w-24 p-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    )}
                  </div>

                  {/* Mandatory Approval Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nội dung ghi chú phê duyệt (Căn cứ duyệt, lưu ý kỹ thuật) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Nhập căn cứ phê duyệt hoặc chỉ đạo kỹ thuật..."
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                /* Already resolved claim */
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">
                    Kết quả xử lý: {selectedClaim.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                  </div>
                  {selectedClaim.approval_notes && (
                    <p className="text-xs text-slate-600">
                      <strong>Ghi chú duyệt:</strong> {selectedClaim.approval_notes}
                    </p>
                  )}
                  {selectedClaim.rejection_reason && (
                    <p className="text-xs text-rose-700">
                      <strong>Lý do từ chối:</strong> {selectedClaim.rejection_reason}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>

              {selectedClaim.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Đang xử lý...' : 'Phê duyệt hỗ trợ'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

