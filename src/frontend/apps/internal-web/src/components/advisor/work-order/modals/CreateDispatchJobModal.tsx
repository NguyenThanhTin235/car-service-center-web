'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

  // Form states - Chuẩn hóa toàn bộ dữ liệu Job
  const [jobCode, setJobCode] = useState('');
  const [jobName, setJobName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | 'NEW'>('NEW');
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedJobTypeId, setSelectedJobTypeId] = useState<number | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number>(1.0);
  const [labourPrice, setLabourPrice] = useState<number>(150000);
  const [description, setDescription] = useState('');

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
    }
  }, [isOpen, finding, targetServiceId, targetServiceName, markerLabel, workOrder, job]);

  // Load danh mục Loại công việc & Nhân viên kỹ thuật
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingData(true);

    Promise.allSettled([
      jobTypeApi.getAll({ limit: 50 }),
      employeeApi.getAll({ limit: 50 }),
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
          setEmployees(emps);
        }
      })
      .finally(() => {
        if (mounted) setLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Submit Lưu / Cập nhật công việc
  const handleSave = async () => {
    if (!jobName.trim()) {
      toast.error('Vui lòng nhập tên công việc');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/60 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">
                {job ? 'build_circle' : 'assignment_add'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-title-sm font-bold text-on-surface tracking-tight">
                  {job ? 'Chi tiết công việc điều phối' : 'Tạo công việc điều phối'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                  {job
                    ? isJobAssigned
                      ? job.status === 'COMPLETED'
                        ? 'Đã hoàn thành'
                        : 'Đang thực hiện'
                      : selectedTechnicianId
                        ? 'Đã phân công'
                        : 'Chờ điều phối'
                    : selectedTechnicianId
                      ? 'Đã chọn KTV'
                      : 'Tạo thủ công'}
                </span>
              </div>
              <p className="text-body-xs text-on-surface-variant">
                Phiếu: <span className="font-semibold text-primary">#{workOrder.wo_number}</span>
                {finding && (
                  <span>
                    {' '}• Vết lỗi: <strong className="text-amber-700">#{finding.id} ({markerLabel})</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* BODY - CHỈ GIỮ THÔNG TIN CÔNG VIỆC CHUẨN HÓA TIẾNG VIỆT */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Hàng 1: Mã công việc & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Mã công việc
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/60 font-mono text-body-sm font-bold text-blue-800">
                <span className="material-symbols-outlined text-[16px] text-blue-600">tag</span>
                <span>{jobCode}</span>
              </div>
            </div>

            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Trạng thái điều phối
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/60 text-body-sm font-medium text-slate-700">
                <span
                  className={`w-2 h-2 rounded-full ${
                    job?.status === 'COMPLETED'
                      ? 'bg-emerald-500'
                      : job?.status === 'IN_PROGRESS'
                      ? 'bg-blue-500 animate-pulse'
                      : selectedTechnicianId
                      ? 'bg-blue-600'
                      : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span className="font-semibold text-blue-700">
                  {job?.status === 'COMPLETED'
                    ? 'Đã hoàn thành'
                    : job?.status === 'IN_PROGRESS'
                    ? 'Đang thực hiện'
                    : selectedTechnicianId
                    ? 'Đã phân công'
                    : 'Chờ điều phối'}
                </span>
              </div>
            </div>
          </div>

          {/* Hàng: Hạng mục dịch vụ áp dụng */}
          {targetServiceId || targetServiceName ? (
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Thuộc Hạng mục dịch vụ
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl text-body-sm font-semibold text-blue-900 dark:text-blue-200">
                <span className="material-symbols-outlined text-[18px] text-blue-600">category</span>
                <span className="truncate">
                  {targetServiceName ||
                    workOrder.services?.find((s) => s.id === targetServiceId)?.name ||
                    'Hạng mục dịch vụ'}
                </span>
                <span className="ml-auto text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                  Hạng mục chỉ định
                </span>
              </div>
            </div>
          ) : !job && workOrder.services && workOrder.services.length > 0 ? (
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Thuộc Hạng mục dịch vụ <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value === 'NEW' ? 'NEW' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-[42px] cursor-pointer"
              >
                {workOrder.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="NEW">+ Tạo hạng mục mới...</option>
              </select>
              {selectedServiceId === 'NEW' && (
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Nhập tên hạng mục mới..."
                  className="mt-2 w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-blue-600"
                />
              )}
            </div>
          ) : null}

          {/* Hàng 2: Tên công việc (Bắt buộc) */}
          <div>
            <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
              Tên công việc khắc phục <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={jobName}
              disabled={isReadOnlyMode}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="VD: Kiểm tra, tháo lắp và phục hồi chi tiết..."
              className={`w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm font-medium text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-2xs ${
                isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default' : ''
              }`}
            />
          </div>

          {/* Hàng 3: Vết lỗi kiểm tra liên quan & Loại công việc kỹ thuật */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Vết lỗi kiểm tra liên quan
              </label>
              <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-start gap-2 h-[42px] items-center">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">
                  report_problem
                </span>
                <div className="text-body-xs truncate">
                  <span className="font-semibold text-on-surface">
                    {finding ? (
                      <>
                        <span className="font-mono text-amber-800 font-bold">
                          ISS-{String(finding.id).padStart(3, '0')}
                        </span>{' '}
                        • {markerLabel}
                      </>
                    ) : (
                      'Công việc kỹ thuật chung'
                    )}
                  </span>
                  {finding?.part_name && (
                    <span className="text-on-surface-variant text-[11px] ml-1">
                      ({finding.part_name})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Loại công việc kỹ thuật <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedJobTypeId || ''}
                disabled={isReadOnlyMode}
                onChange={(e) => setSelectedJobTypeId(Number(e.target.value))}
                className={`w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-[42px] ${
                  isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default' : 'cursor-pointer'
                }`}
              >
                <option value="">-- Chọn loại công việc --</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 4: Kỹ thuật viên phụ trách & Thời gian định mức ước tính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-body-xs font-semibold text-on-surface-variant">
                  Kỹ thuật viên phụ trách
                </label>
                {selectedTechnicianId && !isReadOnlyMode && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 animate-fade-in">
                    <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                    Phân công ngay khi lưu
                  </span>
                )}
              </div>
              <select
                value={selectedTechnicianId || ''}
                disabled={isReadOnlyMode}
                onChange={(e) => setSelectedTechnicianId(Number(e.target.value) || null)}
                className={`w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 h-[42px] ${
                  isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default' : 'cursor-pointer'
                }`}
              >
                <option value="">-- Chưa chỉ định (Điều phối sau) --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
                Thời gian định mức ước tính (Giờ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={estimatedHours}
                  disabled={isReadOnlyMode}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className={`w-full pl-3 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm font-semibold text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono h-[42px] ${
                    isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default' : ''
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-on-surface-variant text-body-xs font-medium">
                  giờ
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 5: Mô tả công việc & Phương án xử lý chi tiết */}
          <div>
            <label className="block text-body-xs font-semibold text-on-surface-variant mb-1.5">
              Mô tả chi tiết & Phương án xử lý kỹ thuật
            </label>
            <textarea
              rows={3}
              value={description}
              disabled={isReadOnlyMode}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú chi tiết quy trình xử lý, lưu ý khi tháo lắp hoặc tiêu chuẩn kiểm tra lại sau khi hoàn thiện..."
              className={`w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm text-on-surface outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all resize-none ${
                isReadOnlyMode ? 'bg-surface-container-low/60 cursor-default' : ''
              }`}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low">
          {isReadOnlyMode ? (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-body-sm transition-all shadow-sm cursor-pointer"
            >
              Đóng
            </button>
          ) : (
            <>
              {/* Nút Xóa công việc khi chưa phân công */}
              {canDeleteJob && (
                <div className="mr-auto">
                  {confirmDelete ? (
                    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 p-1 rounded-xl border border-red-200 dark:border-red-800 animate-fade-in">
                      <span className="text-[12px] font-semibold text-red-600 dark:text-red-400 px-1">
                        Chắc chắn xóa?
                      </span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDelete}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-body-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        {deleting ? 'Đang xóa...' : 'Xóa ngay'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
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
                      className="flex items-center gap-1 px-3 py-2 text-error hover:bg-error/10 rounded-xl text-body-sm font-semibold transition-colors cursor-pointer"
                      title="Xóa công việc chưa phân công này"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                      <span>Xóa công việc</span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high text-body-sm font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-body-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
                    <span>{job ? 'Cập nhật thay đổi' : 'Lưu công việc'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
