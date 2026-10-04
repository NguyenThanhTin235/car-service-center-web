'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { jobTypeApi, JobTypeData } from '@/lib/api/jobTypes';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Toast from '@/components/shared/Toast';

interface FormData {
  name: string;
  description: string;
  hourlyRate: string;
}

const defaultForm: FormData = { name: '', description: '', hourlyRate: '' };

type ToastState = { message: string; type: 'success' | 'error' } | null;
type ConfirmAction = { type: 'toggle'; item: JobTypeData } | { type: 'delete'; item: JobTypeData } | null;

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState<JobTypeData[]>([]);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JobTypeData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await jobTypeApi.getAll({ search, page, limit: 10 });
      setJobTypes(res.data.data);
      setPagination(res.data.pagination);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // ── Form handlers ────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setFormData(defaultForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (j: JobTypeData) => {
    setEditing(j);
    setFormData({ name: j.name, description: j.description || '', hourlyRate: String(j.hourlyRate) });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        hourlyRate: parseFloat(formData.hourlyRate),
      };
      if (editing) {
        await jobTypeApi.update(editing.id, payload);
        showToast('Cập nhật loại công việc thành công!', 'success');
      } else {
        await jobTypeApi.create(payload);
        showToast('Thêm loại công việc thành công!', 'success');
      }
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      setFormError(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle (Kích hoạt / Vô hiệu hóa) ───────────────────────
  const requestToggle = (j: JobTypeData) => {
    setConfirmAction({ type: 'toggle', item: j });
  };

  // ── Delete (Xóa hẳn) ─────────────────────────────────────────
  const requestDelete = (j: JobTypeData) => {
    setConfirmAction({ type: 'delete', item: j });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'toggle') {
        const res = await jobTypeApi.toggle(confirmAction.item.id);
        const isNowActive = res.data.data?.isActive;
        showToast(
          isNowActive ? 'Đã kích hoạt loại công việc.' : 'Đã vô hiệu hóa loại công việc.',
          'success'
        );
      } else if (confirmAction.type === 'delete') {
        await jobTypeApi.delete(confirmAction.item.id);
        showToast('Đã xóa loại công việc thành công.', 'success');
      }
      load(pagination.currentPage);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const activeCount = jobTypes.filter(j => j.isActive).length;

  const getConfirmProps = () => {
    if (!confirmAction) return { title: '', message: '', isDestructive: false, confirmText: 'Xác nhận' };
    const { item } = confirmAction;
    if (confirmAction.type === 'delete') {
      return {
        title: 'Xóa loại công việc',
        message: `Bạn có chắc chắn muốn xóa hẳn loại công việc "${item.name}"? Hành động này không thể hoàn tác.`,
        confirmText: 'Xóa',
        isDestructive: true,
      };
    }
    if (item.isActive) {
      return {
        title: 'Vô hiệu hóa loại công việc',
        message: `Bạn có chắc chắn muốn vô hiệu hóa loại công việc "${item.name}"?`,
        confirmText: 'Vô hiệu hóa',
        isDestructive: true,
      };
    }
    return {
      title: 'Kích hoạt loại công việc',
      message: `Bạn có chắc chắn muốn kích hoạt lại loại công việc "${item.name}"?`,
      confirmText: 'Kích hoạt',
      isDestructive: false,
    };
  };

  const confirmProps = getConfirmProps();

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-[Be_Vietnam_Pro,sans-serif] text-[#0b1c30]">
      {/* Header */}
      <header className="fixed top-0 left-64 right-0 h-14 z-30 bg-white/90 backdrop-blur border-b border-[#c2c6d8]/30 flex items-center px-6">
        <div className="flex items-center gap-1 text-xs text-[#424656]">
          <span>Admin</span>
          <span className="material-symbols-outlined text-sm text-[#727687]">chevron_right</span>
          <span className="font-semibold text-[#0b1c30]">Loại công việc</span>
        </div>
      </header>

      <main className="pt-14 px-6 py-6">
        {/* Page title + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#0b1c30] tracking-tight">Loại công việc</h1>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0050cd] font-mono text-xs font-semibold">
                Job Type
              </span>
            </div>
            <p className="text-sm text-[#424656] mt-1">
              Cấu hình các loại công việc kỹ thuật và đơn giá theo giờ.
            </p>
          </div>
          <button
            id="btn-add-job-type"
            onClick={openCreate}
            className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white flex items-center gap-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm self-start"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Thêm loại công việc
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng loại CV', value: pagination.totalRecords, icon: 'work', color: 'text-[#0050cd]' },
            { label: 'Đang hoạt động', value: activeCount, icon: 'check_circle', color: 'text-[#10b981]' },
            { label: 'Vô hiệu hóa', value: pagination.totalRecords - activeCount, icon: 'cancel', color: 'text-[#ef4444]' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-white shadow-sm border border-[#e5eeff] flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#424656] uppercase tracking-wider font-semibold">{s.label}</span>
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              </div>
              <div className="font-mono text-2xl font-bold text-[#0b1c30]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="w-full rounded-xl bg-white shadow-sm border border-[#e5eeff] overflow-hidden">
          {/* Search bar */}
          <div className="p-3 flex items-center gap-2 border-b border-[#e5eeff]">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#525970] text-lg">search</span>
              <input
                id="search-job-type"
                className="w-full h-9 pl-9 pr-4 rounded bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#424656] text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0866ff] transition-all"
                placeholder="Tìm theo tên loại công việc..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load(1)}
              />
            </div>
            <button
              id="btn-refresh-job-types"
              onClick={() => load(1)}
              className="h-9 w-9 rounded bg-[#eff4ff] hover:bg-[#e5eeff] flex items-center justify-center text-[#424656] transition-colors"
              title="Làm mới"
            >
              <span className="material-symbols-outlined text-lg">sync</span>
            </button>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="h-9 bg-[#f8f9ff] text-[#424656] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                  <th className="px-4 font-mono">ID</th>
                  <th className="px-4">Tên loại công việc</th>
                  <th className="px-4">Đơn giá / giờ</th>
                  <th className="px-4 text-right pr-6">Trạng thái & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-[#424656]">
                      <span className="material-symbols-outlined animate-spin text-2xl text-[#0866ff]">progress_activity</span>
                    </td>
                  </tr>
                ) : jobTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-[#424656]">
                      <span className="material-symbols-outlined text-3xl text-[#c2c6d8] block mb-1">search_off</span>
                      Không tìm thấy loại công việc
                    </td>
                  </tr>
                ) : jobTypes.map(j => (
                  <tr key={j.id} className={`h-14 hover:bg-[#f8f9ff]/70 transition-colors ${!j.isActive ? 'opacity-55' : ''}`}>
                    <td className="px-4 font-mono text-xs font-medium text-[#0050cd]">
                      JT-{String(j.id).padStart(3, '0')}
                    </td>
                    <td className="px-4">
                      <div className="text-xs font-semibold text-[#0b1c30]">{j.name}</div>
                      {j.description && (
                        <div className="text-[10px] text-[#727687] truncate max-w-[320px]">{j.description}</div>
                      )}
                    </td>
                    <td className="px-4 font-mono text-xs text-[#0b1c30] font-semibold">
                      {Number(j.hourlyRate).toLocaleString('vi-VN')} ₫/h
                    </td>
                    <td className="px-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          j.isActive
                            ? 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]'
                            : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
                        }`}>
                          {j.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>

                        {/* Edit */}
                        <button
                          id={`btn-edit-jt-${j.id}`}
                          onClick={() => openEdit(j)}
                          className="w-7 h-7 rounded hover:bg-[#e5eeff] text-[#424656] flex items-center justify-center transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>

                        {/* Toggle active/inactive */}
                        <button
                          id={`btn-toggle-jt-${j.id}`}
                          onClick={() => requestToggle(j)}
                          className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                            j.isActive
                              ? 'bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444]'
                              : 'bg-[#ecfdf5] hover:bg-[#10b981] hover:text-white text-[#10b981]'
                          }`}
                          title={j.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {j.isActive ? 'toggle_off' : 'toggle_on'}
                          </span>
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-jt-${j.id}`}
                          onClick={() => requestDelete(j)}
                          className="w-7 h-7 rounded bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white text-[#ef4444] flex items-center justify-center transition-colors"
                          title="Xóa loại công việc"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 flex items-center justify-between border-t border-[#e5eeff]">
            <span className="text-xs text-[#424656]">
              Tổng <span className="font-semibold text-[#0b1c30]">{pagination.totalRecords}</span> loại công việc
            </span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    className={`w-8 h-8 rounded font-mono text-xs font-semibold transition-colors ${
                      p === pagination.currentPage
                        ? 'bg-[#0866ff] text-white'
                        : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Form Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5eeff]">
              <h2 className="text-base font-semibold text-[#0b1c30]">
                {editing ? 'Cập nhật loại công việc' : 'Thêm loại công việc'}
              </h2>
              <button
                id="btn-close-form-modal"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded hover:bg-[#eff4ff] text-[#424656] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Form */}
            <form id="form-job-type" onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-[#fef2f2] text-[#dc2626] text-xs border border-[#fecaca] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {formError}
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">
                  Tên loại công việc <span className="text-[#ef4444]">*</span>
                </span>
                <input
                  id="input-jt-name"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]/20 transition-all"
                  placeholder="VD: Thay dầu động cơ, Kiểm tra phanh..."
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">
                  Đơn giá / giờ (VNĐ) <span className="text-[#ef4444]">*</span>
                </span>
                <input
                  id="input-jt-hourly-rate"
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.hourlyRate}
                  onChange={e => setFormData(p => ({ ...p, hourlyRate: e.target.value }))}
                  className="h-9 px-3 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]/20 transition-all"
                  placeholder="150000"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#424656]">Mô tả</span>
                <textarea
                  id="input-jt-description"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-[#c2c6d8] rounded text-sm focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]/20 resize-none transition-all"
                  rows={2}
                  placeholder="Mô tả loại công việc (tùy chọn)"
                />
              </label>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  id="btn-cancel-form"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 rounded border border-[#c2c6d8] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors"
                >
                  Hủy
                </button>
                <button
                  id="btn-submit-form"
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded bg-[#0866ff] hover:bg-[#1877f2] text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5 transition-all"
                >
                  {submitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  )}
                  {submitting ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmText={(confirmProps as any).confirmText}
        isDestructive={confirmProps.isDestructive}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
