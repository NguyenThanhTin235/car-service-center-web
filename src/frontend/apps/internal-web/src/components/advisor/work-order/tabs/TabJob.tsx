'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  reorderJobs,
} from '@/lib/api/work-order.api';
import { employeeApi, EmployeeData } from '@/lib/api/employees';
import toast from 'react-hot-toast';
import AIJobPlannerModal from '../modals/AIJobPlannerModal';
import CreateDispatchJobModal from '../modals/CreateDispatchJobModal';
import AddPartModal from '../modals/AddPartModal';

interface TabJobProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
  isReadOnly?: boolean;
}

const SERVICE_STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: 'schedule' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'autorenew' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'check_circle' },
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
      label: 'Đang làm',
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
      label: 'Đạt KĐ',
      bg: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'verified',
    };
  }
  if (currentEmployeeId) {
    return {
      label: 'Đã phân công',
      bg: 'bg-primary/10 border-primary/20',
      text: 'text-primary',
      icon: 'how_to_reg',
    };
  }
  return {
    label: 'Chờ điều phối',
    bg: 'bg-surface-container border-outline-variant/60',
    text: 'text-on-surface-variant',
    icon: 'pending',
  };
};

const PRICING_TYPE_MAP: Record<string, string> = {
  FIXED: 'Trọn gói',
  VEHICLE_SIZE: 'Theo cỡ xe',
  LABOUR_PARTS: 'Công & Phụ tùng',
};

// Hàm lấy chữ cái đầu của tên KTV (VD: "Nguyễn Văn A" -> "NA")
const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function TabJob({ workOrder, refetchWO, isReadOnly = false }: TabJobProps) {
  const services = workOrder?.services || [];
  const isWOClosed = isReadOnly || ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '');

  // Trích xuất toàn bộ findings từ kiểm tra xe
  const allFindings = workOrder?.inspections?.flatMap((i) => i.findings) || [];
  // Lọc các lỗi chưa được liên kết với bất kỳ công việc nào
  const unlinkedFindings = allFindings.filter(
    (f) => !f.job_findings || f.job_findings.length === 0
  );

  const [creatingFindingId, setCreatingFindingId] = useState<number | null>(null);
  const [dispatchFinding, setDispatchFinding] = useState<any | null>(null);

  // Trạng thái thu gọn/mở rộng từng Hạng mục
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<number>>(new Set());

  // Tìm kiếm theo tên hạng mục hoặc công việc
  const [filterQuery, setFilterQuery] = useState('');

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

  // Modal Khai báo phụ tùng cho công việc (UC-36)
  const [addPartJobId, setAddPartJobId] = useState<number | null>(null);

  // Load danh sách nhân viên kỹ thuật
  useEffect(() => {
    let mounted = true;
    employeeApi
      .getAll({ limit: 100, position: 'TECHNICIAN' })
      .then((res) => {
        if (!mounted) return;
        const list: EmployeeData[] = res.data?.data || res.data || [];
        setTechnicians(
          list.filter((e) => e.isActive !== false && e.position === 'TECHNICIAN')
        );
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

  // Sắp xếp thứ tự công việc trong hạng mục
  const [reorderingServiceId, setReorderingServiceId] = useState<number | null>(null);

  const handleMoveJob = async (svc: WoService, currentIndex: number, direction: -1 | 1) => {
    if (!workOrder || reorderingServiceId) return;
    const currentJobs = [...(svc.jobs || [])];
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= currentJobs.length) return;

    const [movedJob] = currentJobs.splice(currentIndex, 1);
    currentJobs.splice(targetIndex, 0, movedJob);

    try {
      setReorderingServiceId(svc.id);
      const jobIds = currentJobs.map((j) => j.id);
      const res = await reorderJobs(workOrder.id, svc.id, jobIds);
      if (res.success) {
        toast.success(`Đã chuyển: "${movedJob.name}"`);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi sắp xếp thứ tự');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi sắp xếp');
    } finally {
      setReorderingServiceId(null);
    }
  };

  // Xóa Hạng mục
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAdding && catalog.length === 0) {
      loadCatalog();
    }
  }, [isAdding]);

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

  const existingTemplateIds = services
    .map((s) => s.service_id)
    .filter((id): id is number => id !== null);

  const filteredCatalog = catalog.filter((t) => {
    if (existingTemplateIds.includes(t.id)) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const matchName = t.name.toLowerCase().includes(q);
    const matchCategory = ((t as any).category?.name || '').toLowerCase().includes(q);
    return matchName || matchCategory;
  });

  // Thống kê tổng số lượng công việc & giờ định mức
  const { grandTotalJobs, grandTotalHours, grandAssignedJobs, grandCompletedJobs } = useMemo(() => {
    let totalJobs = 0;
    let totalHours = 0;
    let assigned = 0;
    let completed = 0;

    services.forEach((s) => {
      const jobs = s.jobs || [];
      totalJobs += jobs.length;
      jobs.forEach((j) => {
        totalHours += Number(j.estimated_hours) || 0;
        const empId = (j as any).technician_id || j.labours?.[0]?.employee_id || j.labours?.[0]?.employee?.id;
        if (empId) assigned++;
        if (j.status === 'COMPLETED' || j.status === 'PASSED') completed++;
      });
    });

    return {
      grandTotalJobs: totalJobs,
      grandTotalHours: totalHours,
      grandAssignedJobs: assigned,
      grandCompletedJobs: completed,
    };
  }, [services]);

  // Lọc theo tìm kiếm
  const displayedServices = useMemo(() => {
    if (!filterQuery.trim()) return services;
    const q = filterQuery.toLowerCase().trim();
    return services.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      return (s.jobs || []).some((j) => j.name.toLowerCase().includes(q));
    });
  }, [services, filterQuery]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. MINI KPI STATS BAR - Nắm bắt chỉ số trong 1 giây */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">category</span>
          </div>
          <div>
            <div className="text-label-xs text-on-surface-variant font-medium">Hạng mục</div>
            <div className="text-title-sm font-bold text-on-surface">{services.length} mục</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
          </div>
          <div>
            <div className="text-label-xs text-on-surface-variant font-medium">Công việc con</div>
            <div className="text-title-sm font-bold text-on-surface">{grandTotalJobs} việc</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
          <div>
            <div className="text-label-xs text-on-surface-variant font-medium">Định mức giờ</div>
            <div className="text-title-sm font-bold text-on-surface font-mono">{grandTotalHours.toFixed(1)}h</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
          <div>
            <div className="text-label-xs text-on-surface-variant font-medium">Đã phân công KTV</div>
            <div className="text-title-sm font-bold text-on-surface font-mono">
              {grandAssignedJobs}/{grandTotalJobs}
            </div>
          </div>
        </div>
      </div>


      {/* 3. UNIFIED ACTION TOOLBAR */}
      <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tìm kiếm & Thu gọn/Mở rộng */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-2.5">
              search
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Tìm hạng mục hoặc công việc..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-body-xs text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-2 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-outline-variant/40 pl-2">
            <button
              type="button"
              onClick={expandAll}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Mở rộng tất cả hạng mục"
            >
              <span className="material-symbols-outlined text-[18px]">unfold_more</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Thu gọn tất cả hạng mục"
            >
              <span className="material-symbols-outlined text-[18px]">unfold_less</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Add service & AI suggest */}
        {!isWOClosed && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Dropdown Thêm dịch vụ thủ công */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-label-sm font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Thêm dịch vụ</span>
              </button>

              {isAdding && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant p-3 z-30 animate-in fade-in duration-100">
                  <div className="relative mb-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-2.5 top-2">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm dịch vụ từ danh mục..."
                      autoFocus
                      className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {loadingCatalog ? (
                      <div className="py-6 text-center text-on-surface-variant text-body-xs">
                        Đang tải danh mục...
                      </div>
                    ) : filteredCatalog.length === 0 ? (
                      <div className="py-6 text-center text-on-surface-variant text-body-xs">
                        Không tìm thấy dịch vụ phù hợp
                      </div>
                    ) : (
                      filteredCatalog.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => handleAddService(item.id)}
                          className="w-full text-left p-2 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-body-xs font-semibold text-on-surface group-hover:text-primary truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-on-surface-variant truncate">
                              {(item as any).category?.name || 'Dịch vụ'} • {PRICING_TYPE_MAP[item.pricing_type] || item.pricing_type}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary shrink-0">
                            add_circle
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nút Đề xuất Job bằng AI (Nổi bật) */}
            <button
              type="button"
              onClick={() => {
                setAiTargetService(null);
                setIsAIModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-label-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Đề xuất bằng AI</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. DANH SÁCH HẠNG MỤC DỊCH VỤ / SỬA CHỮA */}
      {displayedServices.length > 0 ? (
        <div className="space-y-3.5">
          {displayedServices.map((svc) => {
            const isExpanded = expandedServiceIds.has(svc.id);
            const isRepair = Boolean(svc.service?.category?.name?.toLowerCase().includes('sửa chữa') || svc.service_id === null || (svc as any).finding_id);
            const jobs = svc.jobs || [];

            // Thống kê riêng cho hạng mục
            const totalHours = jobs.reduce((sum, j) => sum + (Number(j.estimated_hours) || 0), 0);
            const completedJobs = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'PASSED').length;
            const progressPercent = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

            return (
              <div
                key={svc.id}
                className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xs overflow-hidden transition-all"
              >
                {/* HEADER HẠNG MỤC (Thanh bar gọn gàng, rõ nét) */}
                <div
                  onClick={() => toggleExpand(svc.id)}
                  className="px-4 py-3 bg-surface-container-low/70 hover:bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Nút mở rộng chevron */}
                    <button
                      type="button"
                      className="p-0.5 rounded text-on-surface-variant hover:text-on-surface transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>

                    {/* Icon loại hình */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isRepair
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {isRepair ? 'handyman' : 'build_circle'}
                      </span>
                    </div>

                    {/* Tên Hạng mục */}
                    <h4 className="text-body-sm font-bold text-on-surface truncate">
                      {svc.name}
                    </h4>

                    {/* Badge loại giá */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface-variant shrink-0">
                      {PRICING_TYPE_MAP[svc.pricing_type] || svc.pricing_type}
                    </span>

                    {/* Mini Progress Pill */}
                    {jobs.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-body-xs font-mono text-on-surface-variant shrink-0">
                        <span className="font-bold text-on-surface">{jobs.length} việc</span>
                        <span>•</span>
                        <span>{totalHours.toFixed(1)}h</span>
                        {progressPercent > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{progressPercent}%</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isWOClosed && (
                      <>
                        {/* Nút AI đề xuất riêng cho hạng mục */}
                        <button
                          type="button"
                          onClick={() => {
                            setAiTargetService({ id: svc.id, name: svc.name });
                            setIsAIModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-label-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                          title="AI đề xuất các bước thi công cho hạng mục này"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                          <span className="hidden md:inline">AI gợi ý việc</span>
                        </button>

                        {/* Nút thêm việc con */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingJob(null);
                            setManualJobTargetService(svc);
                            setManualJobModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-label-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors cursor-pointer"
                          title="Thêm công việc thủ công"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>Thêm việc</span>
                        </button>

                        {/* Xóa hạng mục */}
                        {deleteConfirm === svc.id ? (
                          <div className="flex items-center gap-1 bg-surface-container px-1 py-0.5 rounded-lg border border-error/30 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => handleRemoveService(svc.id)}
                              disabled={deleting}
                              className="px-2 py-0.5 bg-error text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Xóa?
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="p-0.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(svc.id)}
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                            title="Xóa hạng mục này"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* NỘI DUNG JOBS TRONG HẠNG MỤC */}
                {isExpanded && (
                  <div className="p-3">
                    {jobs.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
                        <table className="w-full text-left text-body-xs border-collapse">
                          <thead>
                            <tr className="bg-surface-container-low/60 border-b border-outline-variant/40 text-[11px] text-on-surface-variant uppercase font-semibold">
                              <th className="px-3 py-2 text-center w-12">#</th>
                              <th className="px-3 py-2">Công việc & Loại thợ</th>
                              <th className="px-3 py-2 w-56">Kỹ thuật viên phụ trách</th>
                              <th className="px-3 py-2 text-center w-20">Định mức</th>
                              <th className="px-3 py-2 text-center w-28">Trạng thái</th>
                              {!isWOClosed && <th className="px-3 py-2 text-center w-20">Thao tác</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30">
                            {jobs.map((job, jIdx) => {
                              const currentEmployeeId =
                                (job as any).technician_id ||
                                job.labours?.[0]?.employee_id ||
                                job.labours?.[0]?.employee?.id ||
                                null;
                              const currentEmp = technicians.find((t) => t.id === currentEmployeeId);
                              const technicianName =
                                currentEmp?.fullName ||
                                job.labours?.[0]?.employee?.full_name ||
                                (currentEmployeeId ? `KTV #${currentEmployeeId}` : '');

                              const jobStatus = getJobStatusInfo(job, currentEmployeeId);

                              return (
                                <tr
                                  key={job.id}
                                  className="hover:bg-surface-container-low/40 transition-colors group"
                                >
                                  {/* STT & Di chuyển */}
                                  <td className="px-3 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <span className="font-mono text-on-surface-variant font-bold">
                                        {jIdx + 1}
                                      </span>
                                      {!isWOClosed && jobs.length > 1 && (
                                        <div className="opacity-0 group-hover:opacity-100 flex flex-col transition-opacity">
                                          <button
                                            type="button"
                                            disabled={jIdx === 0 || reorderingServiceId === svc.id}
                                            onClick={() => handleMoveJob(svc, jIdx, -1)}
                                            className="text-on-surface-variant hover:text-primary disabled:opacity-20 cursor-pointer"
                                            title="Lên trên"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">expand_less</span>
                                          </button>
                                          <button
                                            type="button"
                                            disabled={jIdx === jobs.length - 1 || reorderingServiceId === svc.id}
                                            onClick={() => handleMoveJob(svc, jIdx, 1)}
                                            className="text-on-surface-variant hover:text-primary disabled:opacity-20 cursor-pointer"
                                            title="Xuống dưới"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">expand_more</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Tên công việc & Phân loại */}
                                  <td className="px-3 py-2.5">
                                    <div
                                      onClick={() => {
                                        setManualJobTargetService(svc);
                                        setEditingJob(job);
                                        setManualJobModalOpen(true);
                                      }}
                                      className="font-semibold text-body-xs text-on-surface hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <span>{job.name}</span>
                                      <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 text-primary">
                                        edit
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant">
                                        {job.job_type?.name || 'Kỹ thuật'}
                                      </span>
                                      {job.parts && job.parts.length > 0 ? (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isWOClosed) setAddPartJobId(job.id);
                                          }}
                                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 ${!isWOClosed ? 'cursor-pointer hover:bg-primary/20' : ''}`}
                                          title={!isWOClosed ? 'Nhấn để khai báo thêm phụ tùng' : ''}
                                        >
                                          <span className="material-symbols-outlined text-[11px]">construction</span>
                                          {job.parts.length} phụ tùng
                                        </span>
                                      ) : !isWOClosed ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAddPartJobId(job.id);
                                          }}
                                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                          title="Khai báo phụ tùng"
                                        >
                                          <span className="material-symbols-outlined text-[11px]">add</span>
                                          + Phụ tùng
                                        </button>
                                      ) : null}
                                      {job.description && (
                                        <span className="text-[11px] text-on-surface-variant truncate max-w-xs">
                                          {job.description}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Kỹ thuật viên phụ trách (Select box với initials avatar) */}
                                  <td className="px-3 py-2.5">
                                    {!isWOClosed && job.status === 'PLANNED' ? (
                                      <div className="relative flex items-center w-full min-w-[190px]">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold absolute left-2 pointer-events-none ${
                                            currentEmployeeId
                                              ? 'bg-primary text-white'
                                              : 'bg-surface-container-high text-on-surface-variant'
                                          }`}
                                        >
                                          {currentEmployeeId ? getInitials(technicianName) : '+'}
                                        </div>
                                        <select
                                          value={currentEmployeeId || ''}
                                          disabled={assigningJobId === job.id}
                                          onChange={(e) =>
                                            handleAssignTechnicianOnTable(
                                              job,
                                              e.target.value ? Number(e.target.value) : null
                                            )
                                          }
                                          className={`w-full pl-9 pr-6 py-1 bg-surface-container-low hover:bg-surface-container border rounded-lg text-body-xs outline-none transition-all cursor-pointer appearance-none shadow-2xs ${
                                            currentEmployeeId
                                              ? 'border-primary/40 text-on-surface font-semibold bg-primary/5'
                                              : 'border-outline-variant/60 text-on-surface-variant italic'
                                          } focus:border-primary focus:bg-surface-container-lowest`}
                                        >
                                          <option value="">-- Chưa phân công --</option>
                                          {currentEmployeeId && !technicians.some((t) => t.id === currentEmployeeId) && (
                                            <option value={currentEmployeeId}>
                                              {technicianName || `KTV #${currentEmployeeId}`}
                                            </option>
                                          )}
                                          {technicians.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                              {emp.fullName}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="material-symbols-outlined text-[15px] absolute right-2 text-on-surface-variant pointer-events-none">
                                          arrow_drop_down
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-body-xs">
                                        {technicianName ? (
                                          <>
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                              {getInitials(technicianName)}
                                            </div>
                                            <span className="font-semibold text-on-surface truncate">{technicianName}</span>
                                          </>
                                        ) : (
                                          <span className="text-on-surface-variant italic">Chưa phân công</span>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* Định mức giờ */}
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="font-mono text-body-xs font-bold text-on-surface">
                                      {Number(job.estimated_hours || 0).toFixed(1)}h
                                    </span>
                                  </td>

                                  {/* Trạng thái */}
                                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${jobStatus.bg} ${jobStatus.text}`}
                                    >
                                      <span className="material-symbols-outlined text-[12px]">
                                        {jobStatus.icon}
                                      </span>
                                      {jobStatus.label}
                                    </span>
                                  </td>

                                  {/* Thao tác */}
                                  {!isWOClosed && (
                                    <td className="px-3 py-2.5 text-center">
                                      {confirmDeleteJobId === job.id ? (
                                        <div className="inline-flex items-center gap-1 bg-surface-container px-1 py-0.5 rounded border border-error/30 animate-fade-in">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteJob(job)}
                                            disabled={deletingJobId === job.id}
                                            className="px-1.5 py-0.2 bg-error text-white rounded text-[10px] font-bold cursor-pointer"
                                          >
                                            Xóa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteJobId(null)}
                                            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setManualJobTargetService(svc);
                                              setEditingJob(job);
                                              setManualJobModalOpen(true);
                                            }}
                                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                            title="Sửa công việc"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setAddPartJobId(job.id)}
                                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                            title="Khai báo phụ tùng cho công việc này"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">construction</span>
                                          </button>
                                          {job.status === 'PLANNED' && (
                                            <button
                                              type="button"
                                              onClick={() => setConfirmDeleteJobId(job.id)}
                                              className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                                              title="Xóa công việc"
                                            >
                                              <span className="material-symbols-outlined text-[15px]">delete_outline</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* HẠNG MỤC TRỐNG CHƯA CÓ JOB */
                      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/30 text-body-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                          info
                        </span>
                        <span>
                          Hạng mục này chưa có công việc con.
                        </span>
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
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px]">
              {unlinkedFindings.length > 0 ? 'warning' : 'playlist_add'}
            </span>
          </div>
          <h3 className="text-title-sm font-bold text-on-surface">
            {unlinkedFindings.length > 0
              ? `Có ${unlinkedFindings.length} vết lỗi kiểm tra xe cần lập Hạng mục sửa chữa`
              : 'Chưa có hạng mục sửa chữa hay dịch vụ nào'}
          </h3>
          <p className="text-body-xs text-on-surface-variant mt-1.5 max-w-md leading-relaxed">
            {isReadOnly
              ? 'Phiếu công việc này hiện chưa có hạng mục dịch vụ nào được thiết lập.'
              : unlinkedFindings.length > 0
              ? 'Dùng tính năng AI để tự động gom vết lỗi thành Hạng mục thi công dứt điểm, hoặc thêm dịch vụ thủ công.'
              : 'Nhấn "Đề xuất bằng AI" để tự động lập kế hoạch theo xe hoặc chọn dịch vụ thủ công từ danh mục.'}
          </p>

          {!isWOClosed && (
            <div className="flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-label-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Đề xuất bằng AI
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-label-sm font-semibold border border-outline-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
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

      {/* MODAL KHAI BÁO PHỤ TÙNG (UC-36) */}
      {workOrder && addPartJobId !== null && (
        <AddPartModal
          isOpen={addPartJobId !== null}
          onClose={() => setAddPartJobId(null)}
          workOrder={workOrder}
          preselectedJobId={addPartJobId}
          onSuccess={() => {
            setAddPartJobId(null);
            if (refetchWO) refetchWO();
          }}
        />
      )}
    </div>
  );
}
