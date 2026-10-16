'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  WorkOrder,
  WoService,
  WoJob,
  ServiceTemplateOption,
  addServiceToWO,
  removeServiceFromWO,
  getServiceCatalog,
  createServiceFromFinding,
  updateManualJob,
  deleteJob,
} from '@/lib/api/work-order.api';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import toast from 'react-hot-toast';
import AIJobPlannerModal from '../modals/AIJobPlannerModal';
import CreateDispatchJobModal from '../modals/CreateDispatchJobModal';

interface TabJobProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
}

const SERVICE_STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', icon: 'schedule' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'autorenew' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'check_circle' },
};

const getJobStatusInfo = (job: WoJob, currentEmployeeId: number | null) => {
  if (job.status === 'COMPLETED') {
    return {
      label: 'Đã hoàn thành',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: 'check_circle',
    };
  }
  if (job.status === 'IN_PROGRESS') {
    return {
      label: 'Đang thực hiện',
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'timelapse',
    };
  }
  if (job.status === 'REWORK') {
    return {
      label: 'Cần làm lại',
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'refresh',
    };
  }
  if (job.status === 'PASSED') {
    return {
      label: 'Đạt kiểm định',
      bg: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'verified',
    };
  }
  // PLANNED: Kiểm tra nếu đã phân công KTV
  if (currentEmployeeId) {
    return {
      label: 'Đã phân công',
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'how_to_reg',
    };
  }
  return {
    label: 'Chờ điều phối',
    bg: 'bg-slate-500/10 border-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    icon: 'pending',
  };
};

const getServiceStatusInfo = (svc: WoService) => {
  if (svc.status === 'COMPLETED') {
    return { label: 'Hoàn thành', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'check_circle' };
  }
  if (svc.status === 'IN_PROGRESS') {
    return { label: 'Đang thực hiện', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'autorenew' };
  }

  const jobs = svc.jobs || [];
  if (jobs.length > 0) {
    const allAssigned = jobs.every((j) => {
      const empId = j.labours?.[0]?.employee_id || j.labours?.[0]?.employee?.id;
      return j.status !== 'PLANNED' || Boolean(empId);
    });
    const someAssigned = jobs.some((j) => {
      const empId = j.labours?.[0]?.employee_id || j.labours?.[0]?.employee?.id;
      return j.status !== 'PLANNED' || Boolean(empId);
    });

    if (allAssigned) {
      return { label: 'Đã phân công', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'how_to_reg' };
    }
    if (someAssigned) {
      return { label: 'Đang điều phối', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', icon: 'pending_actions' };
    }
  }

  return SERVICE_STATUS_MAP[svc.status] || SERVICE_STATUS_MAP.PENDING;
};

const PRICING_TYPE_MAP: Record<string, string> = {
  FIXED: 'Trọn gói',
  VEHICLE_SIZE: 'Theo loại xe',
  LABOUR_PARTS: 'Nhân công & Phụ tùng',
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'bg-red-500/10 text-red-600 border-red-500/20', text: 'Khẩn cấp' },
  HIGH: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', text: 'Cao' },
  MEDIUM: { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', text: 'Trung bình' },
  LOW: { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', text: 'Thấp' },
};

export default function TabJob({ workOrder, refetchWO }: TabJobProps) {
  const services = workOrder?.services || [];
  const isWOClosed = ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');

  // Trích xuất toàn bộ findings từ kiểm tra xe
  const allFindings = workOrder?.inspections?.flatMap((i) => i.findings) || [];
  // Lọc các lỗi chưa được liên kết với bất kỳ công việc nào
  const unlinkedFindings = allFindings.filter(
    (f) => !f.job_findings || f.job_findings.length === 0
  );

  // State tạo nhanh hạng mục từ finding
  const [creatingFindingId, setCreatingFindingId] = useState<number | null>(null);
  const [dispatchFinding, setDispatchFinding] = useState<any | null>(null);

  // Trạng thái thu gọn/mở rộng từng Hạng mục
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<number>>(new Set());

  // Tự động mở rộng tất cả các hạng mục khi mới load dữ liệu
  useEffect(() => {
    if (services.length > 0) {
      setExpandedServiceIds(new Set(services.map((s) => s.id)));
    }
  }, [services.length]);

  const toggleExpand = (serviceId: number) => {
    setExpandedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedServiceIds(new Set(services.map((s) => s.id)));
  const collapseAll = () => setExpandedServiceIds(new Set());

  // Thêm dịch vụ thủ công từ catalog
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState<ServiceTemplateOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal AI Job Planner
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTargetService, setAiTargetService] = useState<{ id: number; name: string } | null>(null);

  // Kỹ thuật viên & Phân công trực tiếp trên bảng
  const [technicians, setTechnicians] = useState<EmployeeData[]>([]);
  const [assigningJobId, setAssigningJobId] = useState<number | null>(null);

  // Modal Thêm / Chỉnh sửa công việc thủ công
  const [manualJobModalOpen, setManualJobModalOpen] = useState(false);
  const [manualJobTargetService, setManualJobTargetService] = useState<WoService | null>(null);
  const [editingJob, setEditingJob] = useState<any | null>(null);

  // Load danh sách nhân viên kỹ thuật
  useEffect(() => {
    let mounted = true;
    employeeApi
      .getAll({ limit: 100 })
      .then((res) => {
        if (!mounted) return;
        const list: EmployeeData[] = res.data?.data || res.data || [];
        setTechnicians(list.filter((e) => e.isActive !== false));
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách kỹ thuật viên:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Xử lý phân công KTV trực tiếp từ select box trên bảng công việc
  const handleAssignTechnicianOnTable = async (job: WoJob, employeeId: number | null) => {
    if (!workOrder || assigningJobId) return;
    try {
      setAssigningJobId(job.id);
      const res = await updateManualJob(workOrder.id, job.id, {
        technician_id: employeeId,
      });
      if (res.success) {
        const assignedTech = technicians.find((t) => t.id === employeeId);
        if (employeeId && assignedTech) {
          toast.success(`Đã phân công "${job.name}" cho KTV ${assignedTech.fullName}`);
        } else {
          toast.success(`Đã hủy phân công cho công việc "${job.name}"`);
        }
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi phân công kỹ thuật viên');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi cập nhật phân công');
    } finally {
      setAssigningJobId(null);
    }
  };

  // Xóa công việc khi chưa phân công
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState<number | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  const handleDeleteJob = async (job: WoJob) => {
    if (!workOrder || deletingJobId) return;
    try {
      setDeletingJobId(job.id);
      const res = await deleteJob(workOrder.id, job.id);
      if (res.success) {
        toast.success(res.message || `Đã xóa công việc "${job.name}"`);
        setConfirmDeleteJobId(null);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xóa công việc');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa công việc');
    } finally {
      setDeletingJobId(null);
    }
  };

  // Xóa Hạng mục
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load catalog dịch vụ
  useEffect(() => {
    if (isAdding && catalog.length === 0) {
      loadCatalog();
    }
  }, [isAdding]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAdding(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const data = await getServiceCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh mục dịch vụ');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleAddService = async (templateId: number) => {
    if (!workOrder || submitting) return;
    try {
      setSubmitting(true);
      const res = await addServiceToWO(workOrder.id, templateId);
      if (res.success) {
        toast.success(res.message || 'Thêm hạng mục dịch vụ thành công');
        setIsAdding(false);
        setSearchTerm('');
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi thêm dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateServiceFromFinding = async (findingId: number) => {
    if (!workOrder) return;
    try {
      setCreatingFindingId(findingId);
      const res = await createServiceFromFinding(workOrder.id, findingId);
      if (res.success && res.data) {
        toast.success(`Đã tạo Hạng mục: "${res.data.service.name}"`);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi tạo hạng mục từ vết lỗi');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo hạng mục');
    } finally {
      setCreatingFindingId(null);
    }
  };

  const handleRemoveService = async (woServiceId: number) => {
    if (!workOrder || deleting) return;
    try {
      setDeleting(true);
      const res = await removeServiceFromWO(workOrder.id, woServiceId);
      if (res.success) {
        toast.success(res.message || 'Đã xóa hạng mục dịch vụ');
        setDeleteConfirm(null);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xóa dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa dịch vụ');
    } finally {
      setDeleting(false);
    }
  };

  // Lọc catalog: loại bỏ dịch vụ đã thêm
  const existingTemplateIds = services
    .map((s) => s.service_id)
    .filter((id): id is number => id !== null);

  const filteredCatalog = catalog.filter(
    (t) =>
      !existingTemplateIds.includes(t.id) &&
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tổng số lượng công việc & giờ định mức trong toàn bộ phiếu
  let grandTotalJobs = 0;
  let grandTotalHours = 0;

  services.forEach((s) => {
    const jobs = s.jobs || [];
    grandTotalJobs += jobs.length;
    jobs.forEach((j) => {
      grandTotalHours += Number(j.estimated_hours) || 0;
    });
  });

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER KHỐI CÔNG VIỆC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-title-md font-bold text-on-surface">
              Hạng mục sửa chữa & Dịch vụ xưởng
            </h3>
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary/10 text-primary text-label-sm font-bold">
              {services.length} hạng mục
            </span>
            <span className="text-body-xs text-on-surface-variant font-medium bg-surface-container px-2.5 py-0.5 rounded-full">
              {grandTotalJobs} công việc con • {grandTotalHours.toFixed(1)} giờ định mức
            </span>
          </div>
        </div>

        {/* CÁC NÚT THAO TÁC */}
        {!isWOClosed && (
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Nút Đề xuất công việc bằng AI RAG */}
            <button
              onClick={() => {
                setAiTargetService(null);
                setIsAIModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-label-md font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
              title="Sử dụng trí tuệ nhân tạo RAG để tự động gom nhóm lỗi thành từng hạng mục sửa chữa kèm danh sách công việc con"
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Đề xuất Job bằng AI (Tất cả)
            </button>
          </div>
        )}
      </div>

      {/* THANH THAO TÁC NHANH: MỞ RỘNG / THU GỌN */}
      {services.length > 0 && (
        <div className="flex items-center justify-between px-1 text-body-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span>Hiển thị theo từng Hạng mục kèm danh sách công việc giải quyết</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_more</span>
              Mở rộng tất cả
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_less</span>
              Thu gọn tất cả
            </button>
          </div>
        </div>
      )}

      {/* DANH SÁCH CÁC HẠNG MỤC DỊCH VỤ / SỬA CHỮA */}
      {services.length > 0 ? (
        <div className="space-y-5">
          {services.map((svc, idx) => {
            const isExpanded = expandedServiceIds.has(svc.id);
            const statusInfo = getServiceStatusInfo(svc);
            const jobs: WoJob[] = svc.jobs || [];

            // Kiểm tra xem hạng mục này có phải là sửa chữa lỗi không
            const isRepairCategory =
              svc.name.toLowerCase().includes('lỗi') ||
              svc.name.toLowerCase().includes('khắc phục') ||
              svc.name.toLowerCase().includes('sửa chữa') ||
              jobs.some((j) => j.findings && j.findings.length > 0);

            const isMaintenanceCategory =
              svc.name.toLowerCase().includes('bảo dưỡng') ||
              svc.name.toLowerCase().includes('định kỳ');

            const isCarWash =
              svc.name.toLowerCase().includes('rửa xe') ||
              svc.name.toLowerCase().includes('vệ sinh') ||
              svc.name.toLowerCase().includes('nội thất');

            const categoryIcon = isRepairCategory
              ? 'handyman'
              : isMaintenanceCategory
              ? 'build_circle'
              : isCarWash
              ? 'local_car_wash'
              : 'category';

            const categoryTagLabel = isRepairCategory
              ? 'Hạng mục sửa chữa lỗi'
              : isMaintenanceCategory
              ? 'Bảo dưỡng định kỳ'
              : isCarWash
              ? 'Chăm sóc & Rửa xe'
              : 'Dịch vụ kỹ thuật';

            const categoryTagClass = isRepairCategory
              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              : isMaintenanceCategory
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

            const totalHours = jobs.reduce(
              (sum, j) => sum + (Number(j.estimated_hours) || 0),
              0
            );

            const isConfirmingDelete = deleteConfirm === svc.id;

            return (
              <div
                key={svc.id}
                className="rounded-2xl border border-outline-variant/70 overflow-hidden shadow-xs bg-surface-container-lowest transition-all"
              >
                {/* HEADER HẠNG MỤC (CARD ACCORDION HEADER) */}
                <div
                  onClick={() => toggleExpand(svc.id)}
                  className="px-5 py-4 bg-surface-container-low/60 hover:bg-surface-container-low cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 select-none"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Nút toggle accordion */}
                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-transform shrink-0"
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        keyboard_arrow_down
                      </span>
                    </button>

                    {/* Icon phân loại */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${categoryTagClass}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {categoryIcon}
                      </span>
                    </div>

                    {/* Tên hạng mục & Tags */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-label-xs font-bold text-on-surface-variant">
                          #{idx + 1}
                        </span>
                        <h4 className="text-title-sm font-bold text-on-surface truncate">
                          {svc.name}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-bold border ${categoryTagClass}`}
                        >
                          {categoryTagLabel}
                        </span>
                        <span className="text-label-xs px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium">
                          {PRICING_TYPE_MAP[svc.pricing_type] || svc.pricing_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-body-xs text-on-surface-variant">
                        <span>
                          {jobs.length} công việc con
                        </span>
                        <span>•</span>
                        <span>
                          Định mức: <strong>{totalHours.toFixed(1)} giờ</strong>
                        </span>
                        {svc.service?.category?.name && (
                          <>
                            <span>•</span>
                            <span>Danh mục: {svc.service.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái & Thao tác */}
                  <div
                    className="flex items-center gap-3 shrink-0 self-end sm:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-xs font-bold border ${statusInfo.bg} ${statusInfo.color}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {statusInfo.icon}
                      </span>
                      {statusInfo.label}
                    </span>

                    {/* Nút Đề xuất Job bằng AI cho riêng hạng mục này */}
                    {!isWOClosed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiTargetService({ id: svc.id, name: svc.name });
                          setIsAIModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-label-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-95"
                        title={`Sử dụng AI đề xuất các bước công việc con cho riêng hạng mục "${svc.name}"`}
                      >
                        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                        <span>Đề xuất Job (AI)</span>
                      </button>
                    )}

                    {/* Nút Thêm việc thủ công cho riêng hạng mục này */}
                    {!isWOClosed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingJob(null);
                          setManualJobTargetService(svc);
                          setManualJobModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-label-xs font-bold border border-outline-variant transition-all shadow-2xs hover:shadow-xs active:scale-95"
                        title={`Thêm công việc con thủ công cho hạng mục "${svc.name}"`}
                      >
                        <span className="material-symbols-outlined text-[15px]">add_task</span>
                        <span>+ Thêm việc</span>
                      </button>
                    )}

                    {/* Nút Xóa hạng mục */}
                    {!isWOClosed && (
                      <div className="flex items-center">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg border border-error/30 animate-fade-in">
                            <span className="text-body-xs text-error font-medium mr-1">Xóa?</span>
                            <button
                              onClick={() => handleRemoveService(svc.id)}
                              disabled={deleting}
                              className="text-error hover:bg-error/20 p-1 rounded transition-colors disabled:opacity-50"
                              title="Xác nhận xóa hạng mục"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {deleting ? 'progress_activity' : 'check'}
                              </span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded transition-colors"
                              title="Hủy"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(svc.id)}
                            className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"
                            title="Xóa hạng mục dịch vụ này"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete_outline
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* KHỐI NỘI DUNG CON: BẢNG CÔNG VIỆC CON (JOBS LIST) */}
                {isExpanded && (
                  <div className="p-5 animate-fade-in space-y-4">
                    {jobs.length > 0 ? (
                      <div className="space-y-3">
                        <div className="border border-outline-variant/60 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-surface-container-low/70 border-b border-outline-variant/40 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider">
                                <th className="px-3 py-2.5 w-12 text-center">STT</th>
                                <th className="px-3.5 py-2.5 w-[36%] min-w-[260px]">Công việc kỹ thuật cụ thể</th>
                                <th className="px-3.5 py-2.5 min-w-[260px]">Kỹ thuật viên phụ trách</th>
                                <th className="px-2 py-2.5 w-20 text-center">Định mức</th>
                                <th className="px-3 py-2.5 w-36 text-center">Trạng thái</th>
                                {!isWOClosed && <th className="px-2 py-2.5 w-16 text-center">Thao tác</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                              {jobs.map((job, jIdx) => {
                                const currentEmployeeId =
                                  job.labours && job.labours.length > 0
                                    ? job.labours[0].employee_id || job.labours[0].employee?.id || null
                                    : null;
                                const jobStatus = getJobStatusInfo(job, currentEmployeeId);
                                const technicianName =
                                  job.labours && job.labours.length > 0 && job.labours[0]?.employee
                                    ? job.labours[0].employee.full_name
                                    : null;

                                return (
                                  <tr
                                    key={job.id}
                                    onClick={() => {
                                      setManualJobTargetService(svc);
                                      setEditingJob(job);
                                      setManualJobModalOpen(true);
                                    }}
                                    className="hover:bg-blue-50/50 dark:hover:bg-blue-950/25 transition-colors cursor-pointer group"
                                    title="Nhấn để xem chi tiết / chỉnh sửa công việc này"
                                  >
                                    {/* STT */}
                                    <td className="px-3 py-3 text-body-xs font-bold text-on-surface-variant text-center">
                                      {jIdx + 1}
                                    </td>

                                    {/* Tên công việc & Mô tả (Cột hẹp lại vừa vặn) */}
                                    <td className="px-3.5 py-3">
                                      <div className="font-semibold text-body-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span>{job.name}</span>
                                        <span
                                          className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0"
                                          title="Nhấn xem chi tiết"
                                        >
                                          open_in_new
                                        </span>
                                      </div>
                                      {job.description && (
                                        <p className="text-body-xs text-on-surface-variant mt-0.5 line-clamp-2">
                                          {job.description}
                                        </p>
                                      )}
                                    </td>

                                    {/* Kỹ thuật viên phụ trách: Phân công trực tiếp trên bảng */}
                                    <td
                                      className="px-3.5 py-2.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {!isWOClosed && job.status === 'PLANNED' ? (
                                        <div className="relative flex items-center w-full min-w-[220px]">
                                          <span className="material-symbols-outlined text-[16px] absolute left-2.5 text-on-surface-variant pointer-events-none">
                                            {currentEmployeeId ? 'how_to_reg' : 'person_add'}
                                          </span>
                                          <select
                                            value={currentEmployeeId || ''}
                                            disabled={assigningJobId === job.id}
                                            onChange={(e) =>
                                              handleAssignTechnicianOnTable(
                                                job,
                                                e.target.value ? Number(e.target.value) : null
                                              )
                                            }
                                            title="Chọn kỹ thuật viên để phân công trực tiếp"
                                            className={`w-full pl-8 pr-7 py-1.5 bg-surface-container-low hover:bg-surface-container border rounded-lg text-body-xs outline-none transition-all cursor-pointer appearance-none shadow-2xs ${
                                              currentEmployeeId
                                                ? 'border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-semibold bg-blue-50/50 dark:bg-blue-950/20'
                                                : 'border-outline-variant/60 text-on-surface-variant italic font-normal'
                                            } focus:border-blue-600 focus:bg-surface-container-lowest`}
                                          >
                                            <option value="">-- Chưa phân công --</option>
                                            {technicians.map((emp) => (
                                              <option key={emp.id} value={emp.id}>
                                                {emp.fullName} ({emp.position})
                                              </option>
                                            ))}
                                          </select>
                                          {assigningJobId === job.id ? (
                                            <span className="material-symbols-outlined text-[14px] absolute right-2 text-blue-600 animate-spin pointer-events-none">
                                              progress_activity
                                            </span>
                                          ) : (
                                            <span className="material-symbols-outlined text-[16px] absolute right-2 text-on-surface-variant pointer-events-none">
                                              arrow_drop_down
                                            </span>
                                          )}
                                        </div>
                                      ) : technicianName ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container text-body-xs font-semibold text-primary">
                                          <span className="material-symbols-outlined text-[16px]">
                                            how_to_reg
                                          </span>
                                          {technicianName}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-body-xs text-on-surface-variant italic">
                                          <span className="material-symbols-outlined text-[14px]">
                                            person_off
                                          </span>
                                          Chưa phân công
                                        </span>
                                      )}
                                    </td>

                                    {/* Định mức giờ công */}
                                    <td className="px-2 py-3 text-center">
                                      <span className="text-body-sm font-bold text-on-surface">
                                        {Number(job.estimated_hours || 0).toFixed(1)}h
                                      </span>
                                    </td>

                                    {/* Trạng thái công việc */}
                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-xs font-bold border whitespace-nowrap ${jobStatus.bg} ${jobStatus.text}`}
                                      >
                                        <span className="material-symbols-outlined text-[13px]">
                                          {jobStatus.icon}
                                        </span>
                                        {jobStatus.label}
                                      </span>
                                    </td>

                                    {/* Thao tác: Chỉnh sửa & Xóa job (nếu chưa phân công) */}
                                    {!isWOClosed && (
                                      <td
                                        className="px-2 py-3 text-center"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {job.status === 'PLANNED' && (
                                          confirmDeleteJobId === job.id ? (
                                            <div className="inline-flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded-lg border border-error/30 animate-fade-in">
                                              <span className="text-[11px] text-error font-medium">Xóa?</span>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteJob(job)}
                                                disabled={deletingJobId === job.id}
                                                className="text-error hover:bg-error/20 p-0.5 rounded transition-colors disabled:opacity-50 cursor-pointer"
                                                title="Xác nhận xóa công việc"
                                              >
                                                <span className="material-symbols-outlined text-[15px]">
                                                  {deletingJobId === job.id ? 'progress_activity' : 'check'}
                                                </span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setConfirmDeleteJobId(null)}
                                                className="text-on-surface-variant hover:bg-surface-container-high p-0.5 rounded transition-colors cursor-pointer"
                                                title="Hủy"
                                              >
                                                <span className="material-symbols-outlined text-[15px]">close</span>
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center gap-0.5">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setManualJobTargetService(svc);
                                                  setEditingJob(job);
                                                  setManualJobModalOpen(true);
                                                }}
                                                className="p-1 rounded-lg text-on-surface-variant hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                                title="Xem / Chỉnh sửa công việc chi tiết"
                                              >
                                                <span className="material-symbols-outlined text-[16px]">
                                                  edit
                                                </span>
                                              </button>

                                              {/* Chỉ hiển thị nút Xóa khi CHƯA PHÂN CÔNG */}
                                              {!currentEmployeeId && (
                                                <button
                                                  type="button"
                                                  onClick={() => setConfirmDeleteJobId(job.id)}
                                                  className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                                                  title="Xóa công việc này (chưa phân công KTV)"
                                                >
                                                  <span className="material-symbols-outlined text-[16px]">
                                                    delete_outline
                                                  </span>
                                                </button>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* HẠNG MỤC TRỐNG CHƯA CÓ JOB */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/30">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[22px] text-on-surface-variant shrink-0">
                            info
                          </span>
                          <div>
                            <p className="text-body-sm font-medium text-on-surface">
                              Hạng mục này chưa có danh sách công việc con chi tiết
                            </p>
                            <p className="text-body-xs text-on-surface-variant">
                              Dùng AI để tự động đề xuất quy trình, hoặc thêm thủ công công việc và phân công KTV ngay.
                            </p>
                          </div>
                        </div>

                        {!isWOClosed && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setAiTargetService({ id: svc.id, name: svc.name });
                                setIsAIModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-label-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                              <span>Đề xuất Job (AI)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingJob(null);
                                setManualJobTargetService(svc);
                                setManualJobModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest hover:bg-surface-container text-on-surface border border-outline-variant rounded-xl text-label-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">add_task</span>
                              <span>+ Thêm việc thủ công</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TRẠNG THÁI CHƯA CÓ HẠNG MỤC NÀO */
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[36px]">
              {unlinkedFindings.length > 0 ? 'warning' : 'playlist_add'}
            </span>
          </div>
          <h3 className="text-title-md font-bold text-on-surface">
            {unlinkedFindings.length > 0
              ? `Có ${unlinkedFindings.length} vết lỗi trên xe cần lập Hạng mục sửa chữa`
              : 'Chưa có hạng mục sửa chữa hay dịch vụ nào'}
          </h3>
          <p className="text-body-md text-on-surface-variant mt-2 max-w-lg leading-relaxed">
            {unlinkedFindings.length > 0
              ? `Các dấu vết hư hại đã được đánh dấu trong quá trình khám xe. Nhấn "Đề xuất Job bằng AI" để AI tự động lập từng Hạng mục sửa chữa lỗi kèm danh sách các bước thi công giải quyết dứt điểm.`
              : `Phiếu công việc này đang trống. Nhấn "Đề xuất Job bằng AI" để hệ thống tự động gom các vết lỗi kiểm tra xe thành từng Hạng mục sửa chữa cụ thể kèm các dịch vụ khác, hoặc nhấn "Thêm dịch vụ" để chọn thủ công từ danh mục.`}
          </p>

          {!isWOClosed && (
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-label-md font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                Đề xuất Job bằng AI
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-label-md font-semibold border border-outline-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Thêm dịch vụ thủ công
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL AI JOB PLANNER */}
      {workOrder && (
        <AIJobPlannerModal
          isOpen={isAIModalOpen}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiTargetService(null);
          }}
          workOrderId={workOrder.id}
          workOrderNumber={workOrder.wo_number}
          targetServiceId={aiTargetService?.id}
          targetServiceName={aiTargetService?.name}
          onSuccess={() => {
            setAiTargetService(null);
            if (refetchWO) refetchWO();
          }}
        />
      )}

      {/* MODAL THÊM / SỬA CÔNG VIỆC THỦ CÔNG */}
      {workOrder && (manualJobModalOpen || dispatchFinding) && (
        <CreateDispatchJobModal
          isOpen={manualJobModalOpen || Boolean(dispatchFinding)}
          onClose={() => {
            setManualJobModalOpen(false);
            setManualJobTargetService(null);
            setEditingJob(null);
            setDispatchFinding(null);
          }}
          workOrder={workOrder}
          finding={dispatchFinding}
          targetServiceId={manualJobTargetService?.id}
          targetServiceName={manualJobTargetService?.name}
          job={editingJob}
          onSuccess={() => {
            setManualJobModalOpen(false);
            setManualJobTargetService(null);
            setEditingJob(null);
            setDispatchFinding(null);
            if (refetchWO) refetchWO();
          }}
        />
      )}
    </div>
  );
}
