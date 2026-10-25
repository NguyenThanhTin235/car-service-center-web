'use client';

import React, { useState, useEffect } from 'react';
import {
  AISuggestedJob,
  AISuggestedService,
  AIJobPlanResponse,
  getAIJobSuggestions,
  applyAIJobs,
} from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';

interface AIJobPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: number;
  workOrderNumber: string;
  targetServiceId?: number | null;
  targetServiceName?: string | null;
  onSuccess: () => void;
}

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CRITICAL: { label: 'Khẩn cấp', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
  HIGH: { label: 'Cao', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
  MEDIUM: { label: 'Trung bình', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  LOW: { label: 'Thấp', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
};

export default function AIJobPlannerModal({
  isOpen,
  onClose,
  workOrderId,
  workOrderNumber,
  targetServiceId,
  targetServiceName,
  onSuccess,
}: AIJobPlannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [planData, setPlanData] = useState<AIJobPlanResponse | null>(null);

  // Danh sách các Hạng mục dịch vụ/sửa chữa
  const [editableServices, setEditableServices] = useState<AISuggestedService[]>([]);
  // Set chứa key định danh job được chọn: `${serviceIdx}-${jobIdx}`
  const [selectedJobKeys, setSelectedJobKeys] = useState<Set<string>>(new Set());

  // Trạng thái thu gọn/mở rộng phân tích chẩn đoán AI
  const [showAiDetails, setShowAiDetails] = useState(false);

  // Key của job đang mở chế độ inline edit: `${serviceIdx}-${jobIdx}` hoặc null
  const [editingJobKey, setEditingJobKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    } else {
      setPlanData(null);
      setEditableServices([]);
      setSelectedJobKeys(new Set());
      setShowAiDetails(false);
      setEditingJobKey(null);
    }
  }, [isOpen, workOrderId, targetServiceId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await getAIJobSuggestions(workOrderId, targetServiceId || undefined);
      if (res.success && res.data) {
        setPlanData(res.data);
        const services = res.data.suggested_services || [];
        setEditableServices(services);

        // Mặc định chọn tất cả các jobs của tất cả hạng mục
        const allKeys = new Set<string>();
        services.forEach((svc, sIdx) => {
          svc.jobs.forEach((_, jIdx) => {
            allKeys.add(`${sIdx}-${jIdx}`);
          });
        });
        setSelectedJobKeys(allKeys);
      } else {
        toast.error(res.message || 'Không thể tạo đề xuất công việc từ AI');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi gọi AI');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobKey = (key: string) => {
    const next = new Set(selectedJobKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedJobKeys(next);
  };

  const toggleServiceSelect = (serviceIdx: number) => {
    const svc = editableServices[serviceIdx];
    if (!svc) return;

    const serviceKeys = svc.jobs.map((_, jIdx) => `${serviceIdx}-${jIdx}`);
    const allSelected = serviceKeys.every((k) => selectedJobKeys.has(k));

    const next = new Set(selectedJobKeys);
    if (allSelected) {
      serviceKeys.forEach((k) => next.delete(k));
    } else {
      serviceKeys.forEach((k) => next.add(k));
    }
    setSelectedJobKeys(next);
  };

  const selectAll = () => {
    const allKeys = new Set<string>();
    editableServices.forEach((s, sIdx) => {
      s.jobs.forEach((_, jIdx) => allKeys.add(`${sIdx}-${jIdx}`));
    });
    setSelectedJobKeys(allKeys);
  };

  const deselectAll = () => {
    setSelectedJobKeys(new Set());
  };

  const selectUrgentOnly = () => {
    const urgentKeys = new Set<string>();
    editableServices.forEach((s, sIdx) => {
      s.jobs.forEach((j, jIdx) => {
        if (j.severity === 'CRITICAL' || j.severity === 'HIGH') {
          urgentKeys.add(`${sIdx}-${jIdx}`);
        }
      });
    });
    setSelectedJobKeys(urgentKeys);
    if (urgentKeys.size === 0) {
      toast('Không có công việc khẩn cấp (Critical / High)', { icon: 'ℹ️' });
    } else {
      toast.success(`Đã chọn ${urgentKeys.size} công việc khẩn cấp`);
    }
  };

  const handleUpdateServiceName = (serviceIdx: number, newName: string) => {
    setEditableServices((prev) => {
      const clone = [...prev];
      clone[serviceIdx] = { ...clone[serviceIdx], service_name: newName };
      return clone;
    });
  };

  const handleUpdateJobField = (
    serviceIdx: number,
    jobIdx: number,
    field: keyof AISuggestedJob,
    value: any
  ) => {
    setEditableServices((prev) => {
      const clone = [...prev];
      const targetJobs = [...clone[serviceIdx].jobs];
      targetJobs[jobIdx] = { ...targetJobs[jobIdx], [field]: value };
      clone[serviceIdx] = { ...clone[serviceIdx], jobs: targetJobs };
      return clone;
    });
  };

  const handleAddJobToService = (serviceIdx: number) => {
    const defaultJobType = planData?.available_job_types[0];
    const defaultTech = planData?.available_technicians?.[0];
    const newJob: AISuggestedJob = {
      name: 'Công việc kỹ thuật bổ sung',
      description: 'Kiểm tra và xử lý bổ sung',
      job_type_id: defaultJobType?.id || 1,
      job_type_name: defaultJobType?.name || 'Kỹ thuật tổng hợp',
      estimated_hours: 1.0,
      severity: 'MEDIUM',
      matched_finding_ids: editableServices[serviceIdx]?.finding_id
        ? [editableServices[serviceIdx].finding_id!]
        : [],
      assigned_technician_id: defaultTech?.id || null,
      assigned_technician_name: defaultTech?.full_name || null,
      assignment_reason: defaultTech ? `Tự động phân công cho KTV: ${defaultTech.full_name}` : null,
      match_score: 80,
    };

    setEditableServices((prev) => {
      const clone = [...prev];
      const jobs = [...clone[serviceIdx].jobs, newJob];
      clone[serviceIdx] = { ...clone[serviceIdx], jobs };
      return clone;
    });

    const newKey = `${serviceIdx}-${editableServices[serviceIdx].jobs.length}`;
    setSelectedJobKeys((prev) => new Set(prev).add(newKey));
    setEditingJobKey(newKey);
  };

  const handleRemoveJobFromService = (serviceIdx: number, jobIdx: number) => {
    setEditableServices((prev) => {
      const clone = [...prev];
      const jobs = clone[serviceIdx].jobs.filter((_, idx) => idx !== jobIdx);
      clone[serviceIdx] = { ...clone[serviceIdx], jobs };
      return clone;
    });

    const targetKey = `${serviceIdx}-${jobIdx}`;
    setSelectedJobKeys((prev) => {
      const next = new Set(prev);
      next.delete(targetKey);
      return next;
    });
    if (editingJobKey === targetKey) {
      setEditingJobKey(null);
    }
  };

  const handleApply = async () => {
    if (selectedJobKeys.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 công việc để áp dụng');
      return;
    }

    const servicesToApply = editableServices
      .map((svc, sIdx) => {
        const selectedJobs = svc.jobs.filter((_, jIdx) =>
          selectedJobKeys.has(`${sIdx}-${jIdx}`)
        );

        if (selectedJobs.length === 0) return null;

        return {
          service_id: svc.service_id,
          service_name: svc.service_name,
          category_type: svc.category_type,
          finding_id: svc.finding_id,
          pricing_type: svc.category_type === 'OTHER' ? 'FIXED' : 'LABOUR_PARTS',
          jobs: selectedJobs.map((j) => ({
            name: j.name,
            description: j.description,
            job_type_id: Number(j.job_type_id),
            estimated_hours: Number(j.estimated_hours),
            matched_finding_ids: j.matched_finding_ids,
            assigned_technician_id: j.assigned_technician_id ? Number(j.assigned_technician_id) : null,
          })),
        };
      })
      .filter(Boolean) as any[];

    if (servicesToApply.length === 0) {
      toast.error('Chưa có hạng mục nào được chọn');
      return;
    }

    try {
      setApplying(true);
      const res = await applyAIJobs(workOrderId, { services: servicesToApply });
      if (res.success) {
        toast.success(
          res.message || `Đã thêm ${res.data?.applied_jobs_count || 'các'} công việc vào phiếu`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi áp dụng công việc');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi lưu công việc');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  // Tính tổng số job & giờ công được chọn
  let totalSelectedJobsCount = 0;
  let totalSelectedHours = 0;

  editableServices.forEach((s, sIdx) => {
    s.jobs.forEach((j, jIdx) => {
      if (selectedJobKeys.has(`${sIdx}-${jIdx}`)) {
        totalSelectedJobsCount++;
        totalSelectedHours += Number(j.estimated_hours) || 0;
      }
    });
  });

  const totalAllJobsCount = editableServices.reduce((acc, s) => acc + s.jobs.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-title-sm font-bold text-on-surface truncate">
                  {targetServiceName ? (
                    <span>Đề xuất quy trình cho: <strong className="text-primary">{targetServiceName}</strong></span>
                  ) : (
                    'Trợ lý Kỹ thuật AI - Lập kế hoạch Hạng mục & Công việc'
                  )}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-xs font-bold uppercase">
                  {targetServiceName ? 'Hạng mục đơn' : 'RAG Toàn diện'}
                </span>
              </div>
              <p className="text-body-xs text-on-surface-variant truncate mt-0.5">
                Phiếu: <span className="font-semibold text-primary">#{workOrderNumber}</span> • Tự động gom lỗi thành Hạng mục và phân công kỹ thuật viên tối ưu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={applying}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                <span className="material-symbols-outlined text-primary text-[26px] animate-pulse select-none flex items-center justify-center leading-none">
                  smart_toy
                </span>
              </div>
              <div>
                <h4 className="text-body-md font-bold text-on-surface">
                  {targetServiceName ? `Đang phân tích các bước cho "${targetServiceName}"...` : 'AI đang phân tích các vết lỗi khám xe & đối soát tiền lệ...'}
                </h4>
                <p className="text-body-xs text-on-surface-variant mt-1 max-w-sm">
                  Tự động đề xuất thời gian định mức và kỹ thuật viên lành nghề nhất.
                </p>
              </div>
            </div>
          ) : planData ? (
            <>
              {/* COLLAPSIBLE SMART SUMMARY BAR */}
              <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                      psychology
                    </span>
                    <span className="text-body-xs text-on-surface font-medium truncate">
                      <strong>Chẩn đoán:</strong> {planData.summary}
                    </span>
                  </div>
                  {planData.risk_assessment && (
                    <button
                      type="button"
                      onClick={() => setShowAiDetails(!showAiDetails)}
                      className="text-label-xs font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      <span>{showAiDetails ? 'Thu gọn' : 'Chi tiết rủi ro'}</span>
                      <span className="material-symbols-outlined text-[16px]">
                        {showAiDetails ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  )}
                </div>

                {showAiDetails && planData.risk_assessment && (
                  <div className="mt-2.5 pt-2.5 border-t border-primary/10 text-body-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">
                      warning
                    </span>
                    <div>
                      <strong>Đánh giá rủi ro an toàn:</strong> {planData.risk_assessment}
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK SELECTION TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-label-sm font-bold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedJobKeys.size === totalAllJobsCount && totalAllJobsCount > 0}
                      onChange={() => {
                        if (selectedJobKeys.size === totalAllJobsCount) {
                          deselectAll();
                        } else {
                          selectAll();
                        }
                      }}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Chọn tất cả ({totalSelectedJobsCount}/{totalAllJobsCount})</span>
                  </label>
                  <span className="text-body-xs text-on-surface-variant font-mono">
                    • <strong>{totalSelectedHours.toFixed(1)}h</strong> công
                  </span>
                </div>

                {/* Quick filter chips */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2.5 py-1 rounded-lg text-label-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  >
                    Chọn hết
                  </button>
                  <button
                    type="button"
                    onClick={selectUrgentOnly}
                    className="px-2.5 py-1 rounded-lg text-label-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">bolt</span>
                    Khẩn cấp
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-2.5 py-1 rounded-lg text-label-xs font-semibold hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* DANH SÁCH HẠNG MỤC & CÔNG VIỆC CON */}
              <div className="space-y-4">
                {editableServices.map((svc, sIdx) => {
                  const isRepair = svc.category_type === 'REPAIR';
                  const finding = svc.finding_info;
                  const severityConfig = finding
                    ? SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.MEDIUM
                    : null;

                  const serviceKeys = svc.jobs.map((_, jIdx) => `${sIdx}-${jIdx}`);
                  const allSelectedInService = serviceKeys.length > 0 && serviceKeys.every((k) => selectedJobKeys.has(k));
                  const someSelectedInService = serviceKeys.some((k) => selectedJobKeys.has(k));

                  const totalServiceHours = svc.jobs.reduce(
                    (sum, j) => sum + (Number(j.estimated_hours) || 0),
                    0
                  );

                  return (
                    <div
                      key={sIdx}
                      className="rounded-2xl border border-outline-variant/60 overflow-hidden shadow-2xs bg-surface-container-lowest transition-all hover:border-primary/40"
                    >
                      {/* HEADER HẠNG MỤC */}
                      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={allSelectedInService}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelectedInService && !allSelectedInService;
                            }}
                            onChange={() => toggleServiceSelect(sIdx)}
                            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer shrink-0"
                          />

                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isRepair
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : svc.category_type === 'MAINTENANCE'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              {isRepair ? 'handyman' : svc.category_type === 'MAINTENANCE' ? 'build_circle' : 'category'}
                            </span>
                          </div>

                          <input
                            type="text"
                            value={svc.service_name}
                            onChange={(e) => handleUpdateServiceName(sIdx, e.target.value)}
                            className="text-body-sm font-bold text-on-surface bg-transparent border-b border-dashed border-transparent hover:border-outline focus:border-primary focus:outline-none px-1 py-0.5 transition-colors flex-1 min-w-[200px]"
                            title="Nhấp để đổi tên hạng mục"
                          />

                          {/* Badges */}
                          {isRepair && finding && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-bold border ${severityConfig?.bg} ${severityConfig?.text} ${severityConfig?.border} shrink-0`}
                            >
                              Lỗi #{finding.id} ({severityConfig?.label})
                            </span>
                          )}

                          {svc.is_existing_service && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              Đã có trên phiếu
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-body-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-mono">
                            {svc.jobs.length} việc • {totalServiceHours.toFixed(1)}h
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddJobToService(sIdx)}
                            className="flex items-center gap-1 px-2 py-1 text-label-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg transition-colors cursor-pointer"
                            title="Thêm công việc vào hạng mục này"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Thêm việc
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH JOBS CON TRONG HẠNG MỤC */}
                      <div className="p-3 space-y-2">
                        {svc.jobs.length === 0 ? (
                          <div className="py-4 text-center text-on-surface-variant text-body-xs italic">
                            Chưa có việc nào. Bấm &quot;Thêm việc&quot; để tạo bước kỹ thuật.
                          </div>
                        ) : (
                          svc.jobs.map((job, jIdx) => {
                            const jobKey = `${sIdx}-${jIdx}`;
                            const isJobSelected = selectedJobKeys.has(jobKey);
                            const isEditing = editingJobKey === jobKey;
                            const jobSeverity = SEVERITY_CONFIG[job.severity] || SEVERITY_CONFIG.MEDIUM;

                            return (
                              <div
                                key={jIdx}
                                className={`rounded-xl border transition-all ${
                                  isJobSelected
                                    ? 'bg-surface-container-lowest border-outline-variant/60 shadow-2xs'
                                    : 'bg-surface-container-low/40 border-transparent opacity-60'
                                }`}
                              >
                                {isEditing ? (
                                  /* INLINE EDIT MODE */
                                  <div className="p-3 space-y-2 bg-surface-container-low/60 rounded-xl">
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="text"
                                        value={job.name}
                                        onChange={(e) =>
                                          handleUpdateJobField(sIdx, jIdx, 'name', e.target.value)
                                        }
                                        className="flex-1 px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface outline-none focus:border-primary"
                                        placeholder="Tên công việc..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setEditingJobKey(null)}
                                        className="px-3 py-1 bg-primary text-white rounded-lg text-label-xs font-bold transition-all hover:bg-primary/90 cursor-pointer"
                                      >
                                        Xong
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {/* Job type */}
                                      <select
                                        value={job.job_type_id}
                                        onChange={(e) =>
                                          handleUpdateJobField(
                                            sIdx,
                                            jIdx,
                                            'job_type_id',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-xs text-on-surface"
                                      >
                                        {planData.available_job_types.map((jt) => (
                                          <option key={jt.id} value={jt.id}>
                                            {jt.name}
                                          </option>
                                        ))}
                                      </select>

                                      {/* Hours */}
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          step="0.5"
                                          min="0.1"
                                          value={job.estimated_hours}
                                          onChange={(e) =>
                                            handleUpdateJobField(
                                              sIdx,
                                              jIdx,
                                              'estimated_hours',
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-20 px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-xs font-bold font-mono text-center"
                                        />
                                        <span className="text-body-xs text-on-surface-variant">giờ</span>
                                      </div>

                                      {/* Technician */}
                                      <select
                                        value={job.assigned_technician_id || ''}
                                        onChange={(e) => {
                                          const empId = e.target.value ? Number(e.target.value) : null;
                                          const found = planData.available_technicians?.find((t) => t.id === empId);
                                          handleUpdateJobField(sIdx, jIdx, 'assigned_technician_id', empId);
                                          handleUpdateJobField(sIdx, jIdx, 'assigned_technician_name', found?.full_name || null);
                                        }}
                                        className="px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-xs text-on-surface"
                                      >
                                        <option value="">-- Chưa gán thợ --</option>
                                        {planData.available_technicians?.map((t) => (
                                          <option key={t.id} value={t.id}>
                                            {t.full_name} ({t.today_assigned_hours}h việc)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                ) : (
                                  /* COMPACT CARD VIEW */
                                  <div className="p-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isJobSelected}
                                        onChange={() => toggleJobKey(jobKey)}
                                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer shrink-0"
                                      />

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-body-sm font-semibold text-on-surface truncate">
                                            {job.name}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container text-on-surface-variant shrink-0">
                                            {job.job_type_name || 'Kỹ thuật'}
                                          </span>
                                          {job.severity && (
                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${jobSeverity.bg} ${jobSeverity.text} ${jobSeverity.border}`}>
                                              {jobSeverity.label}
                                            </span>
                                          )}
                                        </div>
                                        {job.description && (
                                          <p className="text-body-xs text-on-surface-variant truncate mt-0.5">
                                            {job.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right side: KTV + Hours + Quick Edit */}
                                    <div className="flex items-center gap-3 shrink-0">
                                      {/* Suggested Technician */}
                                      {job.assigned_technician_name ? (
                                        <div
                                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-primary text-body-xs font-medium"
                                          title={job.assignment_reason || 'Đề xuất bởi AI'}
                                        >
                                          <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                                          <span className="font-semibold">{job.assigned_technician_name}</span>
                                          {job.match_score && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                              ({job.match_score}%)
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-body-xs text-on-surface-variant italic">
                                          Chưa chọn thợ
                                        </span>
                                      )}

                                      {/* Hours */}
                                      <span className="text-body-xs font-bold text-on-surface font-mono min-w-[36px] text-right">
                                        {Number(job.estimated_hours).toFixed(1)}h
                                      </span>

                                      {/* Action buttons */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setEditingJobKey(jobKey)}
                                          className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                          title="Chỉnh sửa công việc này"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveJobFromService(sIdx, jIdx)}
                                          className="p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                                          title="Xóa công việc này khỏi đề xuất"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-on-surface-variant text-body-sm">
              Không có dữ liệu đề xuất từ AI cho phiếu này.
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-body-xs text-on-surface-variant">
            <span>Đã chọn:</span>
            <span className="font-bold text-primary font-mono text-body-sm">
              {totalSelectedJobsCount}
            </span>
            <span>công việc (<strong>{totalSelectedHours.toFixed(1)}</strong> giờ)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2 rounded-xl border border-outline-variant/80 text-on-surface-variant hover:bg-surface-container-high text-body-sm font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || totalSelectedJobsCount === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-body-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {applying ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang áp dụng...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span>Áp dụng vào Phiếu ({totalSelectedJobsCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
