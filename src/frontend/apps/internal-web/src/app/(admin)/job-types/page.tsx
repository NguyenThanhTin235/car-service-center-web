'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { jobTypeApi, JobTypeData } from '@/lib/api/jobTypes';
import ConfirmModal from '@/components/shared/ConfirmModal';
import Modal from '@/components/shared/Modal';
import TablePagination from '@/components/shared/TablePagination';
import toast from 'react-hot-toast';
import { validateName } from '@/lib/utils/validators';

interface FormData {
  name: string;
  description: string;
}

const defaultForm: FormData = { name: '', description: '' };

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

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
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (j: JobTypeData) => {
    setEditing(j);
    setFormData({ name: j.name, description: j.description || '' });
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.name, 'Tên loại công việc', 2, 100);
    if (nameErr) errors.name = nameErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFieldErrors({});
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };
      if (editing) {
        await jobTypeApi.update(editing.id, payload);
        showToast('Cập nhật loại công việc thành công.', 'success');
      } else {
        await jobTypeApi.create(payload);
        showToast('Thêm loại công việc thành công.', 'success');
      }
      setShowModal(false);
      load(pagination.currentPage);
    } catch (e: any) {
      const errMsg = e.response?.data?.message || 'Có lỗi xảy ra';
      setFormError(errMsg);
      if (errMsg.includes('Tên loại công việc đã tồn tại')) {
        setFieldErrors({ name: errMsg });
      }
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
          isNowActive ? 'Loại công việc đã chuyển sang trạng thái Hoạt động.' : 'Loại công việc đã chuyển sang trạng thái Ngừng hoạt động.',
          'success'
        );
      } else if (confirmAction.type === 'delete') {
        await jobTypeApi.delete(confirmAction.item.id);
        showToast('Xóa loại công việc thành công.', 'success');
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
        title: 'Ngừng hoạt động loại công việc',
        message: `Bạn có chắc chắn muốn ngừng hoạt động loại công việc "${item.name}"?`,
        confirmText: 'Ngừng hoạt động',
        isDestructive: true,
      };
    }
    return {
      title: 'Kích hoạt loại công việc',
      message: `Bạn có chắc chắn muốn kích hoạt lại loại công việc "${item.name}"?`,
      confirmText: 'Hoạt động',
      isDestructive: false,
    };
  };

  const confirmProps = getConfirmProps();

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. Asymmetrical 12-Col Bento Summary (5 + 4 + 3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Card 1: Navy (#0c2340) - Tổng loại công việc (5 cols) */}
        <div className="md:col-span-5 rounded-[24px] bg-[#0c2340] text-white p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-md hover:shadow-lg transition-all group">
          <div className="absolute inset-0 saas-subtle-grid pointer-events-none opacity-40" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">Tổng loại công việc</span>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold tabular-nums tracking-tight text-white mt-1.5">
                {pagination.totalRecords}{' '}
                <span className="text-sm font-sans font-medium text-zinc-300">hạng mục</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xs text-zinc-300 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">work</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
            <span>Phân loại kỹ thuật xưởng</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-mono font-bold text-white">
              {activeCount} đang mở
            </span>
          </div>
        </div>

        {/* Card 2: Royal Blue (#0050cd) - Đang hoạt động (4 cols) */}
        <div className="md:col-span-4 rounded-[24px] bg-[#0050cd] text-white p-5 sm:p-6 flex flex-col justify-between shadow-md shadow-[#0050cd]/20 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-100 tracking-wide">Đang hoạt động</span>
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-white mt-2">
            {activeCount}
          </div>
          <div className="flex items-center justify-between text-xs text-blue-100 mt-2 pt-2 border-t border-white/15">
            <span>Sẵn sàng gán lệnh RO</span>
            <span className="font-mono font-bold">Kích hoạt</span>
          </div>
        </div>

        {/* Card 3: Soft Cool Slate (#e4e7ec) - Ngừng hoạt động (3 cols) */}
        <div className="md:col-span-3 rounded-[24px] bg-[#e4e7ec] text-zinc-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 tracking-wide">Ngừng hoạt động</span>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-rose-600 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 mt-2">
            {jobTypes.length - activeCount}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/80">
            <span>Tạm ngưng (Trang này)</span>
            <span className="font-mono font-semibold text-rose-700">Tạm dừng</span>
          </div>
        </div>
      </div>

      {/* 3. Table card */}
      <div className="w-full saas-card overflow-hidden">
        {/* Search bar */}
        <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-200/80">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              id="search-job-type"
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none focus:bg-white focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 transition-all"
              placeholder="Tìm theo tên loại công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-job-types"
              onClick={() => load(1)}
              className="h-9 px-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0866ff] transition-colors cursor-pointer"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin text-[#0866ff]' : ''}`}>
                sync
              </span>
              <span>Làm mới</span>
            </button>

            <button
              id="btn-add-job-type"
              onClick={openCreate}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white flex items-center gap-1.5 text-xs font-bold transition-all active:scale-[0.98] shadow-sm shadow-[#0866ff]/20 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Thêm loại công việc</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <th className="py-3.5 px-5 font-mono">ID</th>
                <th className="py-3.5 px-5">Tên loại công việc</th>
                <th className="py-3.5 px-5 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-2xl text-[#0866ff] block mx-auto mb-1">
                      progress_activity
                    </span>
                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : jobTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">
                      search_off
                    </span>
                    Không tìm thấy loại công việc
                  </td>
                </tr>
              ) : (
                jobTypes.map((j) => (
                  <tr
                    key={j.id}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      !j.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#0866ff]">
                      JT-{String(j.id).padStart(3, '0')}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-semibold text-slate-900">{j.name}</div>
                      {j.description && (
                        <div className="text-xs text-slate-400 truncate max-w-[340px]">
                          {j.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          j.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {j.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          id={`btn-edit-jt-${j.id}`}
                          onClick={() => openEdit(j)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 text-[#0866ff] flex items-center justify-center transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>

                        {/* Toggle active/inactive */}
                        <button
                          id={`btn-toggle-jt-${j.id}`}
                          onClick={() => requestToggle(j)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                            j.isActive
                              ? 'bg-rose-50 hover:bg-rose-500 hover:text-white border-rose-200/80 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white border-emerald-200/80 text-emerald-600'
                          }`}
                          title={j.isActive ? 'Ngừng hoạt động' : 'Hoạt động'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {j.isActive ? 'toggle_off' : 'toggle_on'}
                          </span>
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-jt-${j.id}`}
                          onClick={() => requestDelete(j)}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-200/80 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa loại công việc"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          currentPage={pagination.currentPage}
          onPageChange={load}
          recordLabel="loại công việc"
        />
      </div>

      {/* ── Form Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Cập nhật loại công việc' : 'Thêm loại công việc'}
        size="md"
      >
        {/* Form */}
        <form id="form-job-type" onSubmit={handleSubmit} noValidate className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  {formError}
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  Tên loại công việc <span className="text-rose-500">*</span>
                </span>
                <input
                  id="input-jt-name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, name: e.target.value }));
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                  }}
                  className={`h-10 px-3 border rounded-xl text-sm transition-all ${
                    fieldErrors.name
                      ? 'bg-white border-rose-400 focus:border-rose-500 ring-2 ring-rose-400/20'
                      : 'bg-slate-50/50 focus:bg-white border-slate-200 focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15'
                  }`}
                  placeholder="VD: Thay dầu động cơ, Kiểm tra phanh..."
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.name}</p>
                )}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Mô tả</span>
                <textarea
                  id="input-jt-description"
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0866ff] focus:ring-2 focus:ring-[#0866ff]/15 resize-none transition-all"
                  rows={2}
                  placeholder="Mô tả loại công việc (tùy chọn)"
                />
              </label>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  id="btn-cancel-form"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  id="btn-submit-form"
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] text-white text-xs font-bold disabled:opacity-60 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {submitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
      </Modal>

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
    </div>
  );
}
