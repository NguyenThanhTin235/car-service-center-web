'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  clearActionError,
  Vehicle,
} from '@/store/slices/vehicleSlice';
import Toast from '@/components/shared/Toast';

// ─────────────── Types ───────────────
type VehicleFormData = {
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
};

export const VEHICLE_SIZES = [
  {
    value: 'SMALL',
    label: 'Cỡ nhỏ (Hạng A - B)',
    shortLabel: 'Cỡ nhỏ',
    desc: 'Hatchback, Sedan nhỏ: Morning, i10, Yaris, Accent...',
    icon: 'minor_crash',
  },
  {
    value: 'MEDIUM',
    label: 'Cỡ vừa (Hạng C)',
    shortLabel: 'Cỡ vừa',
    desc: 'Sedan hạng C, CUV nhỏ: Vios, City, Mazda 3, CX-30...',
    icon: 'directions_car',
  },
  {
    value: 'LARGE',
    label: 'Cỡ lớn (Hạng D - SUV)',
    shortLabel: 'Cỡ lớn',
    desc: 'CUV/SUV cỡ trung & lớn: CX-5, CR-V, Santa Fe, Camry...',
    icon: 'airport_shuttle',
  },
  {
    value: 'XL',
    label: 'Rất lớn (MPV / Bán tải)',
    shortLabel: 'Rất lớn',
    desc: 'Bán tải, MPV gia đình: Ranger, Carnival, Everest...',
    icon: 'rv_hookup',
  },
] as const;

const EMPTY_FORM: VehicleFormData = {
  licensePlate: '',
  make: '',
  model: '',
  year: '',
  color: '',
  vehicleSize: 'MEDIUM',
};

// ─────────────── Status Badge ───────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      Hoạt động tốt
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-outline border border-surface-container-highest">
      <span className="w-1.5 h-1.5 rounded-full bg-outline" />
      Ngừng hoạt động
    </span>
  );
}

// ─────────────── Vehicle Card ───────────────
function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sizeObj = VEHICLE_SIZES.find((s) => s.value === vehicle.vehicleSize);
  const sizeLabel = sizeObj ? sizeObj.label : (vehicle.vehicleSize || 'Chưa xác định');

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-surface-container-high">
        <StatusBadge isActive={vehicle.isActive} />
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-lg z-10 py-1">
              <button
                onClick={() => { onEdit(vehicle); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>edit</span>
                Chỉnh sửa
              </button>
              <button
                onClick={() => { onDelete(vehicle); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error-container/30 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Xóa xe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Primary Info */}
      <div className="px-5 py-4 flex items-start gap-4 border-b border-surface-container-high">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>
            {sizeObj?.icon || 'directions_car'}
          </span>
        </div>
        <div className="min-w-0">
          <span className="inline-block px-2.5 py-0.5 mb-1.5 rounded border border-outline bg-surface-container-low font-mono font-bold tracking-wider text-on-surface text-xs shadow-inner">
            {vehicle.licensePlate}
          </span>
          <h3 className="font-semibold text-on-surface text-base leading-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.year && <p className="text-xs text-on-surface-variant mt-0.5">Năm {vehicle.year}</p>}
        </div>
      </div>

      {/* Specs */}
      <div className="px-5 py-3 grid grid-cols-2 gap-y-2.5 gap-x-4 border-b border-surface-container-high">
        <div>
          <p className="text-xs text-on-surface-variant">Màu sắc</p>
          <p className="text-sm font-medium text-on-surface">{vehicle.color || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">Phân khúc</p>
          <p className="text-xs font-semibold text-primary truncate" title={sizeLabel}>
            {sizeObj?.shortLabel || sizeLabel}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-on-surface-variant">Ngày đăng ký</p>
          <p className="text-sm font-medium text-on-surface">
            {new Date(vehicle.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 flex flex-col gap-2 mt-auto">
        <button
          onClick={() => onEdit(vehicle)}
          className="w-full py-2 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary-fixed transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
          Chỉnh sửa thông tin
        </button>
      </div>

      {/* Backdrop for menu */}
      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

// ─────────────── Vehicle Form Modal (for Edit) ───────────────
function VehicleModal({
  isOpen,
  mode,
  initial,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initial?: Vehicle | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (form: VehicleFormData) => void;
}) {
  const [form, setForm] = useState<VehicleFormData>(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initial) {
        setForm({
          licensePlate: initial.licensePlate,
          make: initial.make,
          model: initial.model,
          year: initial.year?.toString() || '',
          color: initial.color || '',
          vehicleSize: (initial.vehicleSize as VehicleFormData['vehicleSize']) || 'MEDIUM',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, mode, initial]);

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3.5 py-2.5 border border-surface-container-highest rounded-xl text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-outline';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-xl border border-surface-container-highest overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                {mode === 'add' ? 'add_circle' : 'edit'}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-base">
                {mode === 'add' ? 'Thêm phương tiện mới' : 'Chỉnh sửa thông tin xe'}
              </h2>
              {mode === 'edit' && initial && (
                <p className="text-xs text-on-surface-variant font-mono">{initial.licensePlate}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-low text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* License plate */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Biển số xe <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              readOnly={mode === 'edit'}
              placeholder="VD: 51G-123.45"
              className={`${inputClass} font-mono tracking-wider font-bold ${
                mode === 'edit' ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : ''
              }`}
            />
            {mode === 'edit' && (
              <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                Biển số được dùng để quản lý lịch sử kỹ thuật và không thể thay đổi sau khi tạo.
              </p>
            )}
          </div>

          {/* Make + Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Hãng sản xuất <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="VD: Toyota, Mazda..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Dòng xe / Model <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="VD: CX-5, Vios..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Year + Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Năm sản xuất
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="VD: 2022"
                min={1980}
                max={new Date().getFullYear() + 1}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Màu sắc
              </label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="VD: Trắng, Đen, Xám..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Vehicle Size Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              Phân khúc kích thước xe <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VEHICLE_SIZES.map((size) => {
                const isSelected = form.vehicleSize === size.value;
                return (
                  <div
                    key={size.value}
                    onClick={() => setForm({ ...form, vehicleSize: size.value as VehicleFormData['vehicleSize'] })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/30 shadow-2xs'
                        : 'border-surface-container-highest bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{size.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {size.label}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2 leading-snug">
                        {size.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-3.5 py-2.5 rounded-xl text-xs">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-container-high bg-surface-container-low/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-surface-container-highest text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-low transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.licensePlate || !form.make || !form.model}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {mode === 'add' ? 'add' : 'save'}
              </span>
            )}
            {loading ? 'Đang lưu...' : mode === 'add' ? 'Thêm xe' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────── Delete Confirm Modal ───────────────
function DeleteModal({
  vehicle,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  vehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm border border-surface-container-highest overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '28px' }}>warning</span>
          </div>
          <h3 className="font-bold text-on-surface text-lg mb-2">Xác nhận xóa xe</h3>
          <p className="text-sm text-on-surface-variant mb-1">
            Bạn muốn xóa xe{' '}
            <strong className="text-on-surface font-mono">{vehicle.licensePlate}</strong>?
          </p>
          <p className="text-xs text-on-surface-variant bg-surface-container-low border border-surface-container-high px-3 py-2 rounded-lg mt-3">
            Nếu xe đã có lịch sử dịch vụ, xe sẽ được vô hiệu hóa thay vì xóa hoàn toàn.
          </p>
          {error && (
            <div className="mt-3 bg-error-container text-on-error-container px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-surface-container-highest text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-error text-on-error rounded-lg text-sm font-semibold hover:bg-error/90 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            )}
            {loading ? 'Đang xử lý...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────── Main Page ───────────────
export default function VehiclesPage() {
  const dispatch = useAppDispatch();
  const { vehicles, loading, error, actionLoading, actionError } = useAppSelector(
    (state) => state.vehicles
  );

  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedVehicle(null);
    dispatch(clearActionError());
  };

  const handleSubmitVehicle = async (form: VehicleFormData) => {
    const dto = {
      licensePlate: form.licensePlate,
      make: form.make,
      model: form.model,
      year: form.year ? parseInt(form.year) : undefined,
      color: form.color || undefined,
      vehicleSize: form.vehicleSize,
    };

    if (modalMode === 'add') {
      const result = await dispatch(createVehicle(dto));
      if (!result.type.endsWith('/rejected')) {
        handleCloseModal();
        setSuccessMsg(`Thêm xe ${form.licensePlate} thành công!`);
        dispatch(fetchVehicles());
      }
    } else if (modalMode === 'edit' && selectedVehicle) {
      const result = await dispatch(
        updateVehicle({
          id: selectedVehicle.id,
          dto: {
            make: dto.make,
            model: dto.model,
            year: dto.year,
            color: dto.color,
            vehicleSize: dto.vehicleSize,
          },
        })
      );
      if (!result.type.endsWith('/rejected')) {
        handleCloseModal();
        setSuccessMsg(`Cập nhật xe ${selectedVehicle.licensePlate} thành công!`);
        dispatch(fetchVehicles());
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteVehicle(deleteTarget.id));
    if (!result.type.endsWith('/rejected')) {
      const plate = deleteTarget.licensePlate;
      setDeleteTarget(null);
      setSuccessMsg(`Đã xóa xe ${plate}!`);
      dispatch(fetchVehicles());
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchFilter =
      filter === 'all' ? true : filter === 'active' ? v.isActive : !v.isActive;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.licensePlate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const activeCount = vehicles.filter((v) => v.isActive).length;
  const inactiveCount = vehicles.filter((v) => !v.isActive).length;

  return (
    <>
      {/* Modals */}
      <VehicleModal
        isOpen={modalMode !== null}
        mode={modalMode || 'add'}
        initial={selectedVehicle}
        loading={actionLoading}
        error={actionError}
        onClose={handleCloseModal}
        onSubmit={handleSubmitVehicle}
      />
      <DeleteModal
        vehicle={deleteTarget}
        loading={actionLoading}
        error={actionError}
        onClose={() => { setDeleteTarget(null); dispatch(clearActionError()); }}
        onConfirm={handleConfirmDelete}
      />

      {/* Page Header */}
      <section className="mb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3 font-medium">
          <Link href="/customer" className="hover:text-primary transition-colors">Tổng quan</Link>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          <span className="text-on-surface font-semibold">Xe của tôi</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-surface-container-highest">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">Danh sách xe của bạn</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
                {vehicles.length} xe
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">
              Theo dõi tình trạng kỹ thuật, thông tin phân khúc và lịch sử bảo dưỡng cho từng xe.
            </p>
          </div>
          <Link
            href="/customer/vehicles/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            Thêm xe mới
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-surface-container-highest">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-surface-container-lowest border border-surface-container-highest rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
              placeholder="Tìm theo biển số, dòng xe..."
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: `Tất cả (${vehicles.length})` },
              { key: 'active', label: `Hoạt động (${activeCount})` },
              { key: 'inactive', label: `Ngừng (${inactiveCount})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest border border-surface-container-highest text-on-surface-variant hover:border-primary/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Success toast */}
      {successMsg && (
        <Toast
          message={successMsg}
          type="success"
          onClose={() => setSuccessMsg('')}
        />
      )}

      {/* Error state */}
      {error && !loading && (
        <Toast
          message={error}
          type="error"
          onClose={() => dispatch(clearActionError())}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant">Đang tải danh sách xe...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>directions_car</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">
            {search || filter !== 'all' ? 'Không tìm thấy xe phù hợp' : 'Chưa có xe nào'}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-xs mb-6">
            {search || filter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
              : 'Thêm xe đầu tiên của bạn để bắt đầu theo dõi lịch sử bảo dưỡng.'}
          </p>
          {!search && filter === 'all' && (
            <Link
              href="/customer/vehicles/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              Thêm xe đầu tiên
            </Link>
          )}
        </div>
      )}

      {/* Vehicle Grid */}
      {!loading && !error && filtered.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={(v) => { setSelectedVehicle(v); setModalMode('edit'); }}
              onDelete={(v) => { setDeleteTarget(v); dispatch(clearActionError()); }}
            />
          ))}
        </section>
      )}

      {/* Quick Stats */}
      {vehicles.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-container-high">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>insights</span>
            <h2 className="font-bold text-on-surface">Tổng quan xe của bạn</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>directions_car</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Tổng số xe</p>
                <p className="text-xl font-bold text-on-surface">{vehicles.length}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Đang hoạt động</p>
                <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-surface-container text-outline flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>pause_circle</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Ngừng hoạt động</p>
                <p className="text-xl font-bold text-on-surface-variant">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
