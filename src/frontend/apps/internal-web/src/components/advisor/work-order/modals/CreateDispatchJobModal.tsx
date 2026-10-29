'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WorkOrder,
  createManualJob,
  CreateManualJobPayload,
  updateManualJob,
  UpdateManualJobPayload,
  deleteJob,
} from '@/lib/api/work-order.api';
import { InspectionFinding } from '@/lib/api/inspection.api';
import { jobTypeApi, JobTypeData } from '@/lib/api/jobTypes';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import toast from 'react-hot-toast';

interface CreateDispatchJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  finding?: InspectionFinding | null;
  targetServiceId?: number | null;
  targetServiceName?: string | null;
  job?: any | null;
  isViewOnly?: boolean;
  onSuccess?: () => void;
}

export default function CreateDispatchJobModal({
  isOpen,
  onClose,
  workOrder,
  finding,
  targetServiceId,
  targetServiceName,
  job,
  isViewOnly = false,
  onSuccess,
}: CreateDispatchJobModalProps) {
  // Loading & Data states
  const [jobTypes, setJobTypes] = useState<JobTypeData[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form states
  const [jobCode, setJobCode] = useState('');
  const [jobName, setJobName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | 'NEW'>('NEW');
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedJobTypeId, setSelectedJobTypeId] = useState<number | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number>(1.0);
  const [labourPrice, setLabourPrice] = useState<number>(150000);
  const [description, setDescription] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Cho phép chỉnh sửa khi tạo mới HOẶC khi công việc ở trạng thái chưa phân công (PLANNED)
  const isJobAssigned = Boolean(job && job.status && job.status !== 'PLANNED');
  const isReadOnlyMode = Boolean(isViewOnly || isJobAssigned);

  // Lấy nhãn tiếng Việt của loại vết lỗi
  const markerLabel = useMemo(() => {
    if (!finding) return 'Lỗi kỹ thuật';
    switch (finding.marker_type) {
      case 'DENT':
        return 'Móp méo';
      case 'SCRATCH':
        return 'Trầy xước';
      case 'DAMAGE':
        return 'Hư hỏng bể vỡ';
      case 'RUST':
        return 'Rỉ sét';
      case 'MISSING':
        return 'Thiếu phụ tùng';
      default:
        return finding.marker_type || 'Lỗi kỹ thuật';
    }
  }, [finding]);

  // Sinh mã công việc chuẩn hóa & nạp thông tin mặc định
  useEffect(() => {
    if (isOpen) {
      if (job) {
        setJobCode(job.job_code || `CV-${workOrder.id}-${job.id}`);
        setJobName(job.name || '');
        setDescription(job.description || '');
        setEstimatedHours(Number(job.estimated_hours) || 1.0);
        const jtId = job.job_type_id || job.job_type?.id || job.labours?.[0]?.job_type_id || null;
        setSelectedJobTypeId(jtId ? Number(jtId) : null);
        const techId = job.technician_id || job.labours?.[0]?.employee_id || job.labours?.[0]?.employee?.id || null;
        setSelectedTechnicianId(techId ? Number(techId) : null);
        return;
      }

      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `CV-${yearSuffix}${workOrder.id}${finding?.id || '0'}-${randomSeq}`;
      setJobCode(generatedCode);

      // Tên công việc mặc định tiếng Việt
      const defaultName = finding
        ? `Xử lý ${markerLabel.toLowerCase()} tại ${finding.part_name || 'bộ phận xe'}`
        : '';
      setJobName(defaultName);

      // Mô tả mặc định
      setDescription(
        finding?.description
          ? `${finding.description}`
          : finding
          ? `Tiến hành kiểm tra, phục hồi và xử lý triệt để lỗi ${markerLabel.toLowerCase()} tại ${finding.part_name || 'bộ phận xe'}.`
          : ''
      );

      // Tên Hạng mục dịch vụ mới mặc định
      const defaultSvcName = finding
        ? `Khắc phục lỗi: ${markerLabel} tại ${finding.part_name || 'bộ phận xe'}`
        : targetServiceName || 'Hạng mục sửa chữa kỹ thuật';
      setNewServiceName(defaultSvcName);

      // Gán hạng mục dịch vụ: ưu tiên targetServiceId nếu truyền vào từ Hạng mục
      if (targetServiceId) {
        setSelectedServiceId(targetServiceId);
      } else if (workOrder.services && workOrder.services.length > 0) {
        const matchedSvc = workOrder.services.find(
          (s) =>
            s.name.toLowerCase().includes(markerLabel.toLowerCase()) ||
            (finding?.part_name && s.name.toLowerCase().includes(finding.part_name.toLowerCase()))
        );
        if (matchedSvc) {
          setSelectedServiceId(matchedSvc.id);
        } else {
          setSelectedServiceId(workOrder.services[0].id);
        }
      } else {
        setSelectedServiceId('NEW');
      }

      setEstimatedHours(1.0);
      setLabourPrice(150000);

      // Auto-focus vào ô tên công việc sau khi modal hiển thị
      setTimeout(() => {
        if (nameInputRef.current && !isReadOnlyMode) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, finding, targetServiceId, targetServiceName, markerLabel, workOrder, job, isReadOnlyMode]);

  // Load danh mục Loại công việc & Nhân viên kỹ thuật
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingData(true);

    Promise.allSettled([
      jobTypeApi.getAll({ limit: 50 }),
      employeeApi.getAll({ limit: 100, position: 'TECHNICIAN' }),
    ])
      .then(([jobTypeRes, employeeRes]) => {
        if (!mounted) return;

        if (jobTypeRes.status === 'fulfilled') {
          const types: JobTypeData[] =
            jobTypeRes.value?.data?.data || jobTypeRes.value?.data || [];
          setJobTypes(types);
          if (types.length > 0 && !selectedJobTypeId) {
            setSelectedJobTypeId(types[0].id);
          }
        }

        if (employeeRes.status === 'fulfilled') {
          const emps: EmployeeData[] =
            employeeRes.value?.data?.data || employeeRes.value?.data || [];
          setEmployees(
            emps.filter((e) => e.isActive !== false && e.position === 'TECHNICIAN')
          );
        }
      })
      .finally(() => {
        if (mounted) setLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Phím tắt bàn phím: Esc để đóng, Enter để lưu (khi không ở textarea)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, jobName, selectedJobTypeId, selectedTechnicianId, estimatedHours, description]);

  // Submit Lưu / Cập nhật công việc
  const handleSave = async () => {
    if (!jobName.trim()) {
      toast.error('Vui lòng nhập tên công việc');
      nameInputRef.current?.focus();
      return;
    }

    try {
      setSaving(true);

      // Nếu đang sửa job có sẵn khi chưa phân công
      if (job?.id) {
        const updatePayload: UpdateManualJobPayload = {
          name: jobName.trim(),
          job_type_id: selectedJobTypeId || null,
          technician_id: selectedTechnicianId || null,
          description: description.trim() || null,
          estimated_hours: Number(estimatedHours) || 1.0,
        };

        const res = await updateManualJob(workOrder.id, job.id, updatePayload);

        if (res.success) {
          toast.success(`Đã cập nhật công việc: "${jobName}" thành công!`);
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error(res.message || 'Lỗi khi cập nhật công việc');
        }
        return;
      }

      // Tạo mới công việc
      const serviceIdToUse = targetServiceId ? Number(targetServiceId) : (selectedServiceId === 'NEW' ? null : Number(selectedServiceId));
      const payload: CreateManualJobPayload = {
        name: jobName.trim(),
        finding_id: finding?.id || null,
        wo_service_id: serviceIdToUse,
        new_service_name: !serviceIdToUse ? newServiceName.trim() : null,
        job_type_id: selectedJobTypeId || null,
        technician_id: selectedTechnicianId || null,
        description: description.trim() || null,
        estimated_hours: Number(estimatedHours) || 1.0,
        labours: [
          {
            task_name: jobName.trim(),
            employee_id: selectedTechnicianId || null,
            estimated_hours: Number(estimatedHours) || 1.0,
            price: Number(labourPrice) || 150000,
            job_type_id: selectedJobTypeId || null,
          },
        ],
      };

      const res = await createManualJob(workOrder.id, payload);

      if (res.success) {
        const assignedEmp = employees.find((e) => e.id === selectedTechnicianId);
        const assignMsg = assignedEmp ? ` và phân công cho KTV ${assignedEmp.fullName}` : '';
        toast.success(`Đã thêm công việc "${jobName}"${assignMsg} thành công!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi tạo công việc');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu công việc');
    } finally {
      setSaving(false);
    }
  };

  // Xóa công việc khi chưa phân công
  const handleDelete = async () => {
    if (!job?.id) return;
    try {
      setDeleting(true);
      const res = await deleteJob(workOrder.id, job.id);
      if (res.success) {
        toast.success(res.message || `Đã xóa công việc "${jobName}"`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi xóa công việc');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa công việc');
    } finally {
      setDeleting(false);
    }
  };

  // Cho phép xóa khi công việc đã tồn tại và ở trạng thái PLANNED
  const canDeleteJob = Boolean(
    job?.id &&
      job.status === 'PLANNED' &&
      !isReadOnlyMode
  );

  const resolvedServiceName = targetServiceName || workOrder.services?.find((s) => s.id === targetServiceId)?.name;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/60 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL - Tinh gọn, hiển thị ngữ cảnh bằng Breadcrumb Tag */}
        <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">
                {job ? 'edit_note' : 'add_task'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-title-sm font-bold text-on-surface tracking-tight">
                  {job ? (isReadOnlyMode ? 'Chi tiết công việc' : 'Chỉnh sửa công việc') : 'Thêm công việc mới'}
                </h2>
                {job && (
                  <span className="px-2 py-0.5 rounded-full text-label-xs font-semibold bg-surface-container text-on-surface-variant font-mono">
                    {jobCode}
                  </span>
                )}
              </div>
              {/* Context breadcrumb tag */}
              <div className="flex items-center gap-1.5 text-body-xs text-on-surface-variant mt-0.5 truncate">
                <span className="font-semibold text-primary">#{workOrder.wo_number}</span>
                {resolvedServiceName && (
                  <>
                    <span>›</span>
                    <span className="truncate text-on-surface font-medium max-w-[200px]" title={resolvedServiceName}>
                      {resolvedServiceName}
                    </span>
                  </>
                )}
                {finding && (
                  <>
                    <span>›</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold">
                      <span className="material-symbols-outlined text-[13px]">report_problem</span>
                      {markerLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* BODY - Form 2 cột gọn gàng, tập trung vào thao tác chính */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Tên công việc (Input chính, lớn, dễ nhận diện) */}
          <div>
            <label className="block text-body-xs font-bold text-on-surface mb-1.5">
              Tên công việc <span className="text-error font-bold">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={jobName}
              disabled={isReadOnlyMode}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="VD: Kiểm tra, tháo tapi và gò nắn cánh cửa..."
              className={`w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-body-sm font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs ${
                isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : ''
              }`}
            />
          </div>

          {/* Chọn Hạng mục áp dụng (Chỉ hiện khi chưa có targetServiceId chỉ định) */}
          {!targetServiceId && !targetServiceName && !job && workOrder.services && workOrder.services.length > 0 && (
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Thuộc Hạng mục dịch vụ <span className="text-error font-bold">*</span>
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value === 'NEW' ? 'NEW' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                {workOrder.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="NEW">+ Tạo Hạng mục sửa chữa mới...</option>
              </select>
              {selectedServiceId === 'NEW' && (
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Nhập tên hạng mục mới..."
                  className="mt-2 w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-primary"
                />
              )}
            </div>
          )}

          {/* Hàng 2: [Nhóm công việc] & [Kỹ thuật viên phụ trách] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Nhóm công việc <span className="text-error font-bold">*</span>
              </label>
              <select
                value={selectedJobTypeId || ''}
                disabled={isReadOnlyMode}
                onChange={(e) => setSelectedJobTypeId(Number(e.target.value))}
                className={`w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                  isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : 'cursor-pointer'
                }`}
              >
                <option value="">-- Chọn nhóm công việc --</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-body-xs font-semibold text-on-surface-variant">
                  Kỹ thuật viên phụ trách
                </label>
                {selectedTechnicianId && !isReadOnlyMode && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 animate-fade-in">
                    <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                    Phân công ngay
                  </span>
                )}
              </div>
              <select
                value={selectedTechnicianId || ''}
                disabled={isReadOnlyMode}
                onChange={(e) => setSelectedTechnicianId(Number(e.target.value) || null)}
                className={`w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                  isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : 'cursor-pointer'
                }`}
              >
                <option value="">-- Chưa chỉ định (Điều phối sau) --</option>
                {selectedTechnicianId && !employees.some((e) => e.id === selectedTechnicianId) && (
                  <option value={selectedTechnicianId}>
                    {job?.labours?.[0]?.employee?.full_name || `KTV #${selectedTechnicianId}`}
                  </option>
                )}
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 3: [Thời gian định mức] & [Đơn giá dự kiến / Giờ] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Thời gian định mức (Giờ) <span className="text-error font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="40"
                  value={estimatedHours}
                  disabled={isReadOnlyMode}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className={`w-full pl-3 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono ${
                    isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : ''
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-on-surface-variant text-body-xs font-medium pointer-events-none">
                  giờ
                </span>
              </div>
            </div>

            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Đơn giá nhân công (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={labourPrice}
                  disabled={isReadOnlyMode}
                  onChange={(e) => setLabourPrice(parseInt(e.target.value, 10) || 0)}
                  className={`w-full pl-3 pr-12 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono ${
                    isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : ''
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-on-surface-variant text-body-xs font-medium pointer-events-none">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 4: Ghi chú & Yêu cầu kỹ thuật */}
          <div>
            <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
              Ghi chú & Hướng dẫn thi công (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={description}
              disabled={isReadOnlyMode}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú chi tiết quy trình xử lý, lưu ý khi tháo lắp hoặc tiêu chuẩn kiểm tra..."
              className={`w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none ${
                isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default opacity-80' : ''
              }`}
            />
          </div>
        </div>

        {/* FOOTER - Rõ ràng, phân cấp hành động */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low">
          {canDeleteJob ? (
            confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-error-container/40 p-1 rounded-xl border border-error/30 animate-fade-in">
                <span className="text-[12px] font-semibold text-error px-1.5">
                  Xác nhận xóa?
                </span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-error hover:bg-error/90 text-white rounded-lg text-body-xs font-bold transition-all cursor-pointer"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa ngay'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded-lg cursor-pointer"
                  title="Hủy"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-error hover:bg-error/10 rounded-xl text-body-sm font-semibold transition-colors cursor-pointer"
                title="Xóa công việc này"
              >
                <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                <span>Xóa việc</span>
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 rounded-xl border border-outline-variant/80 text-on-surface-variant hover:bg-surface-container-high text-body-sm font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>

            {!isReadOnlyMode && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold text-body-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{job ? 'Cập nhật' : 'Lưu công việc'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
