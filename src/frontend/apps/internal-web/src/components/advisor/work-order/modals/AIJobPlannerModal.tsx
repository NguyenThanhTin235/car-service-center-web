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

  // Danh sách các Hạng mục dịch vụ/sửa chữa (mỗi hạng mục gồm danh sách jobs con)
  const [editableServices, setEditableServices] = useState<AISuggestedService[]>([]);
  // Set chứa key định danh job được chọn: `${serviceIdx}-${jobIdx}`
  const [selectedJobKeys, setSelectedJobKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    } else {
      setPlanData(null);
      setEditableServices([]);
      setSelectedJobKeys(new Set());
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

  const toggleSelectAll = () => {
    let totalJobs = 0;
    editableServices.forEach((s) => (totalJobs += s.jobs.length));

    if (selectedJobKeys.size === totalJobs) {
      setSelectedJobKeys(new Set());
    } else {
      const allKeys = new Set<string>();
      editableServices.forEach((s, sIdx) => {
        s.jobs.forEach((_, jIdx) => allKeys.add(`${sIdx}-${jIdx}`));
      });
      setSelectedJobKeys(allKeys);
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
    };

    setEditableServices((prev) => {
      const clone = [...prev];
      const jobs = [...clone[serviceIdx].jobs, newJob];
      clone[serviceIdx] = { ...clone[serviceIdx], jobs };
      return clone;
    });

    const newKey = `${serviceIdx}-${editableServices[serviceIdx].jobs.length}`;
    setSelectedJobKeys((prev) => new Set(prev).add(newKey));
  };

  const handleRemoveJobFromService = (serviceIdx: number, jobIdx: number) => {
    setEditableServices((prev) => {
      const clone = [...prev];
      const jobs = clone[serviceIdx].jobs.filter((_, idx) => idx !== jobIdx);
      clone[serviceIdx] = { ...clone[serviceIdx], jobs };
      return clone;
    });

    // Rebuild selected keys
    const targetKey = `${serviceIdx}-${jobIdx}`;
    setSelectedJobKeys((prev) => {
      const next = new Set(prev);
      next.delete(targetKey);
      return next;
    });
  };

  const handleApply = async () => {
    if (selectedJobKeys.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 công việc để áp dụng');
      return;
    }

    // Lọc ra các services và jobs được chọn
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-surface rounded-2xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-title-md font-bold text-on-surface">
                  {targetServiceName ? (
                    <span>AI Đề xuất công việc cho hạng mục: <span className="text-primary font-extrabold">{targetServiceName}</span></span>
                  ) : (
                    'Trợ lý Kỹ thuật AI - Lập kế hoạch Hạng mục & Công việc'
                  )}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-label-xs font-semibold uppercase">
                  {targetServiceName ? 'Hạng mục riêng lẻ' : 'RAG Toàn bộ'}
                </span>
              </div>
              <p className="text-body-xs text-on-surface-variant">
                Phiếu: <span className="font-semibold text-primary">{workOrderNumber}</span> • {targetServiceName ? `Chỉ đề xuất danh sách các bước công việc con kỹ thuật phục vụ riêng cho "${targetServiceName}"` : 'Mỗi lỗi kỹ thuật tương ứng 1 Hạng mục sửa chữa gồm danh sách công việc con, kết hợp cùng các dịch vụ khác (bảo dưỡng, rửa xe,..)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={applying}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-[28px] animate-pulse">
                  smart_toy
                </span>
              </div>
              <div>
                <h4 className="text-title-sm font-bold text-on-surface">
                  {targetServiceName ? `Đang phân tích và lập quy trình cho "${targetServiceName}"...` : 'Đang phân tích dữ liệu xe & RAG...'}
                </h4>
                <p className="text-body-sm text-on-surface-variant mt-1 max-w-md">
                  {targetServiceName
                    ? `AI đang đối soát tiêu chuẩn kỹ thuật xưởng để đề xuất danh sách các bước thi công tối ưu cho hạng mục này.`
                    : 'AI đang đối sánh các vết lỗi kiểm tra xe với tiền lệ kỹ thuật xưởng để đề xuất danh sách hạng mục và công việc giải quyết dứt điểm lỗi.'}
                </p>
              </div>
            </div>
          ) : planData ? (
            <>
              {/* CHẨN ĐOÁN TỔNG QUAN TỪ AI */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-label-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  Đánh giá chẩn đoán kỹ thuật tổng quan
                </div>
                <p className="text-body-sm text-on-surface leading-relaxed">{planData.summary}</p>
                {planData.risk_assessment && (
                  <div className="flex items-start gap-2 pt-2 border-t border-blue-500/10 text-body-xs text-amber-700 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[16px] shrink-0 text-amber-600">warning</span>
                    <span><strong>Đánh giá an toàn & rủi ro:</strong> {planData.risk_assessment}</span>
                  </div>
                )}
              </div>

              {/* THANH ĐIỀU HƯỚNG TỔNG QUÁT */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-label-md font-bold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedJobKeys.size === totalAllJobsCount && totalAllJobsCount > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    Chọn tất cả ({totalSelectedJobsCount}/{totalAllJobsCount} công việc)
                  </label>
                  <span className="text-body-xs text-on-surface-variant">
                    • Tổng thời gian: <strong>{totalSelectedHours.toFixed(1)} giờ</strong>
                  </span>
                </div>
                <span className="text-body-xs text-on-surface-variant italic">
                  * Mỗi hạng mục sửa chữa bao gồm danh sách công việc cần làm để khắc phục 1 lỗi
                </span>
              </div>

              {/* DANH SÁCH CÁC HẠNG MỤC DỊCH VỤ & SỬA CHỮA */}
              <div className="space-y-6">
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
                      className="rounded-2xl border border-outline-variant/70 overflow-hidden shadow-sm bg-surface-container-lowest/80 transition-all hover:border-primary/40"
                    >
                      {/* HEADER CỦA HẠNG MỤC */}
                      <div className="px-5 py-3.5 bg-surface-container-low/80 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox chọn cả hạng mục */}
                          <input
                            type="checkbox"
                            checked={allSelectedInService}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelectedInService && !allSelectedInService;
                            }}
                            onChange={() => toggleServiceSelect(sIdx)}
                            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer shrink-0"
                          />

                          {/* Icon phân loại */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isRepair
                                ? 'bg-red-500/10 text-red-600'
                                : svc.category_type === 'MAINTENANCE'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-blue-500/10 text-blue-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isRepair ? 'handyman' : svc.category_type === 'MAINTENANCE' ? 'build_circle' : 'local_car_wash'}
                            </span>
                          </div>

                          {/* Tên Hạng mục có thể sửa trực tiếp */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="text"
                                value={svc.service_name}
                                onChange={(e) => handleUpdateServiceName(sIdx, e.target.value)}
                                className="text-title-sm font-bold text-on-surface bg-transparent border-b border-dashed border-transparent hover:border-outline focus:border-primary focus:outline-none px-1 py-0.5 max-w-xl transition-colors"
                              />

                              {/* Badges */}
                              {isRepair && finding && (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-bold border ${severityConfig?.bg} ${severityConfig?.text} ${severityConfig?.border}`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">build</span>
                                  Xử lý lỗi #{finding.id} ({severityConfig?.label})
                                </span>
                              )}

                              {!isRepair && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-bold bg-secondary/10 text-secondary border border-secondary/20">
                                  {svc.category_type === 'MAINTENANCE' ? 'Bảo dưỡng định kỳ' : 'Dịch vụ xưởng'}
                                </span>
                              )}

                              {svc.is_existing_service && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  Đã có sẵn trên phiếu
                                </span>
                              )}
                            </div>

                            {/* Mô tả lỗi nếu có */}
                            {finding && (
                              <p className="text-body-xs text-on-surface-variant truncate mt-0.5">
                                Vết lỗi: &ldquo;{finding.description}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Thống kê giờ & Nút thêm job con */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <span className="text-body-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-md font-medium">
                            {svc.jobs.length} công việc • {totalServiceHours.toFixed(1)}h
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddJobToService(sIdx)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-md text-label-xs font-semibold transition-colors"
                            title="Thêm công việc con vào hạng mục này"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Thêm việc
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH CÁC CÔNG VIỆC CON (JOBS) CỦA HẠNG MỤC NÀY */}
                      <div className="p-4 space-y-3">
                        {svc.jobs.length === 0 ? (
                          <div className="py-6 text-center text-on-surface-variant text-body-sm italic">
                            Chưa có công việc nào trong hạng mục này. Nhấn &ldquo;Thêm việc&rdquo; để tạo công việc con.
                          </div>
                        ) : (
                          svc.jobs.map((job, jIdx) => {
                            const jobKey = `${sIdx}-${jIdx}`;
                            const isJobSelected = selectedJobKeys.has(jobKey);
                            const jobSeverity = SEVERITY_CONFIG[job.severity] || SEVERITY_CONFIG.MEDIUM;

                            return (
                              <div
                                key={jIdx}
                                className={`p-3.5 rounded-xl border transition-all ${
                                  isJobSelected
                                    ? 'bg-surface-container-low/40 border-primary/30 shadow-xs'
                                    : 'bg-surface-container-lowest/40 border-outline-variant/30 opacity-60'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Checkbox job con */}
                                  <input
                                    type="checkbox"
                                    checked={isJobSelected}
                                    onChange={() => toggleJobKey(jobKey)}
                                    className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer shrink-0"
                                  />

                                  {/* Nội dung job con */}
                                  <div className="flex-1 space-y-2">
                                    {/* Dòng 1: Tên job & Severity */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-label-xs font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded shrink-0">
                                          Việc {jIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={job.name}
                                          onChange={(e) =>
                                            handleUpdateJobField(sIdx, jIdx, 'name', e.target.value)
                                          }
                                          className="flex-1 text-body-sm font-semibold text-on-surface bg-transparent border-b border-transparent hover:border-outline focus:border-primary focus:outline-none px-1 py-0.5 transition-colors"
                                        />
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-label-xs font-bold border ${jobSeverity.bg} ${jobSeverity.text} ${jobSeverity.border}`}
                                        >
                                          {jobSeverity.label}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveJobFromService(sIdx, jIdx)}
                                          className="text-on-surface-variant hover:text-error p-1 rounded transition-colors"
                                          title="Xóa công việc này"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Dòng 2: Mô tả thao tác */}
                                    <input
                                      type="text"
                                      value={job.description || ''}
                                      placeholder="Mô tả kỹ thuật..."
                                      onChange={(e) =>
                                        handleUpdateJobField(sIdx, jIdx, 'description', e.target.value)
                                      }
                                      className="w-full text-body-xs text-on-surface-variant bg-transparent border-b border-transparent hover:border-outline focus:border-primary focus:outline-none px-1 py-0.5"
                                    />

                                    {/* Dòng 3: Cấu hình Nhóm thợ & Giờ công */}
                                    <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-outline-variant/20 text-body-xs">
                                      {/* JobType select */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-on-surface-variant font-medium">Nhóm thợ:</span>
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
                                          className="text-body-xs bg-surface-container px-2 py-1 rounded-md border border-outline-variant text-on-surface focus:outline-none focus:border-primary"
                                        >
                                          {planData.available_job_types.map((jt) => (
                                            <option key={jt.id} value={jt.id}>
                                              {jt.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Giờ công */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-on-surface-variant font-medium">Giờ công:</span>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0.1"
                                          max="12"
                                          value={job.estimated_hours}
                                          onChange={(e) =>
                                            handleUpdateJobField(
                                              sIdx,
                                              jIdx,
                                              'estimated_hours',
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-16 text-body-xs bg-surface-container px-2 py-1 rounded-md border border-outline-variant text-on-surface focus:outline-none focus:border-primary text-center font-bold"
                                        />
                                        <span className="text-on-surface-variant">giờ</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
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
            <div className="py-20 text-center text-on-surface-variant">
              Không có dữ liệu đề xuất từ AI.
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span>Đã chọn:</span>
            <span className="font-bold text-primary">
              {totalSelectedJobsCount} công việc
            </span>
            <span>• Tổng định mức:</span>
            <span className="font-bold text-on-surface">
              {totalSelectedHours.toFixed(1)} giờ công
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={applying}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-outline-variant text-body-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleApply}
              disabled={applying || totalSelectedJobsCount === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-body-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {applying ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Đang ghi nhận vào phiếu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Áp dụng {totalSelectedJobsCount} công việc vào phiếu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
