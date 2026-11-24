'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import InteractiveCarSVG, { Finding as SvgFinding, MarkerType } from './InteractiveCarSVG';
import { WorkOrder, deleteJob } from '@/lib/api/work-order.api';
import {
  getInspection,
  createFinding,
  updateFinding,
  deleteFinding,
  uploadFindingPhoto,
  InspectionFinding,
} from '@/lib/api/inspection.api';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ImageLightbox from '@/components/advisor/common/ImageLightbox';
import InspectionFindingList from './InspectionFindingList';
import toast from 'react-hot-toast';

const CreateDispatchJobModal = dynamic(() => import('../modals/CreateDispatchJobModal'), { ssr: false });
const PhotoLibraryModal = dynamic(
  () => import('../modals/InspectionSubModals').then((m) => m.PhotoLibraryModal),
  { ssr: false }
);
const InspectionLogModal = dynamic(
  () => import('../modals/InspectionSubModals').then((m) => m.InspectionLogModal),
  { ssr: false }
);

interface VehicleInspectionPanelProps {
  workOrder: WorkOrder;
  isReadOnly?: boolean;
  refetchWO?: () => void;
}

/**
 * Nén và giảm kích thước ảnh trên trình duyệt trước khi tải lên
 * Giúp giảm dung lượng từ 5-10MB xuống ~150-300KB, tăng tốc độ upload lên gấp 20 lần
 */
async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
            );
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function VehicleInspectionPanel({
  workOrder,
  isReadOnly: propIsReadOnly = false,
  refetchWO,
}: VehicleInspectionPanelProps) {
  const [selectedTool, setSelectedTool] = useState<MarkerType | null>(null);
  const [inspection, setInspection] = useState<any>(() => workOrder?.inspections?.[0] || null);
  const [findings, setFindings] = useState<InspectionFinding[]>(
    () => (workOrder?.inspections?.[0]?.findings as unknown as InspectionFinding[]) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedFindingId, setHighlightedFindingId] = useState<number | null>(null);

  // Quy định rõ điều kiện kiểm định xe (chỉ có thể đánh dấu vết lỗi lúc Tiếp nhận / Lập kế hoạch)
  // Khi báo giá đã được duyệt (APPROVED), xe đang thi công (IN_PROGRESS), hoặc đã sang thanh toán/chờ giao xe/đóng:
  // Toàn bộ sơ đồ xe và danh sách kiểm định chuyển sang chế độ CHỈ ĐỌC (Read-only)
  const isInspectionLocked = [
    'APPROVED',
    'IN_PROGRESS',
    'BILLING_REQUESTED',
    'FINANCIAL_CLEARED',
    'READY_FOR_DELIVERY',
    'RELEASED',
    'CLOSED',
    'CANCELLED',
  ].includes(workOrder?.status || '');

  const isReadOnly = propIsReadOnly || isInspectionLocked;

  // Uploading state
  const [uploadingFindingId, setUploadingFindingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetFindingIdRef = useRef<number | null>(null);

  // Photo library modal & preview
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Modal tạo / xem chi tiết công việc liên kết với vết lỗi
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState<any | null>(null);

  // Không cho phép xóa job nếu báo giá đã được phê duyệt hoặc WO đã chuyển sang thi công
  const isApprovedOrBeyond = [
    'APPROVED',
    'IN_PROGRESS',
    'BILLING_REQUESTED',
    'FINANCIAL_CLEARED',
    'RELEASED',
    'CLOSED',
  ].includes(workOrder?.status || '');
  const [selectedFindingForJobModal, setSelectedFindingForJobModal] = useState<InspectionFinding | null>(null);

  // Modal xác nhận xóa công việc thay cho alert/confirm
  const [deleteJobConfirm, setDeleteJobConfirm] = useState<{
    jobId: number;
    jobName: string;
  } | null>(null);
  const [isDeletingJob, setIsDeletingJob] = useState(false);

  // Debounce timers for auto-saving notes
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Sync from workOrder.inspections[0] when present; only fetch if missing
  useEffect(() => {
    if (!workOrder?.id) return;
    const embedded = workOrder.inspections?.[0];
    if (embedded) {
      setInspection(embedded as any);
      setFindings((embedded.findings || []) as InspectionFinding[]);
      return;
    }
    loadInspection();
  }, [workOrder?.id, workOrder?.inspections]);

  const loadInspection = async () => {
    try {
      setError(null);
      if (findings.length === 0) {
        setLoading(true);
      }
      const res = await getInspection(workOrder.id);
      if (res.success && res.data) {
        setInspection(res.data);
        setFindings(res.data.findings || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin kiểm tra xe.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinding = useCallback(async (findingData: Omit<SvgFinding, 'id'>) => {
    if (isReadOnly) return;
    try {
      const payload = {
        marker_type: findingData.type,
        part_id: findingData.partId,
        part_name: findingData.partName,
        coordinates: {
          x: findingData.x,
          y: findingData.y,
          part_id: findingData.partId,
        },
        description: '',
        severity: 'MEDIUM' as const,
        evidence_urls: [],
      };

      const res = await createFinding(workOrder.id, payload);
      if (res.success && res.data) {
        setFindings((prev) => [...prev, res.data]);
        toast.success(`Đã ghi nhận: ${res.data.part_name}`);
        setHighlightedFindingId(res.data.id);
        if (refetchWO) refetchWO();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu đánh dấu kiểm tra xe');
    }
  }, [isReadOnly, workOrder.id, refetchWO]);

  const handleSelectFinding = useCallback((id: string | number | null | undefined) => {
    if (id === '' || id === null || id === undefined) {
      setHighlightedFindingId(null);
      return;
    }
    const numericId = Number(id);
    setHighlightedFindingId((prev) => (prev === numericId ? null : numericId));
  }, []);


  const handleRemoveFinding = async (id: number) => {
    if (isReadOnly) return;

    // Kiểm tra ràng buộc phía Client: Chỉ chặn xóa khi việc đã được phân công hoặc đang thực hiện
    const targetFinding = findings.find((f) => f.id === id);
    const assignedJob = targetFinding?.job_findings?.find(
      (jf) => jf.job && (jf.job.status !== 'PLANNED' || (jf.job as any).technician_id)
    );
    if (assignedJob) {
      const jobName = assignedJob.job?.name || `Công việc #${assignedJob.job_id}`;
      toast.error(
        `Không thể xóa: Vết lỗi đã có công việc "${jobName}" được phân công cho kỹ thuật viên hoặc đang thực hiện.`,
        { duration: 5000 }
      );
      return;
    }

    try {
      const res = await deleteFinding(workOrder.id, id);
      if (res.success) {
        setFindings((prev) => prev.filter((f) => f.id !== id));
        if (highlightedFindingId === id) setHighlightedFindingId(null);
        toast.success('Đã xóa đánh dấu thành công');
        if (refetchWO) refetchWO();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh dấu kiểm tra xe');
    }
  };

  const promptDeleteJob = useCallback((jobId: number, jobName: string) => {
    if (isReadOnly || isApprovedOrBeyond) {
      toast.error('Không thể xóa công việc khi báo giá đã được khách hàng phê duyệt.');
      return;
    }
    setDeleteJobConfirm({ jobId, jobName });
  }, [isReadOnly, isApprovedOrBeyond]);

  const handleExecuteDeleteJob = async () => {
    if (!workOrder?.id || !deleteJobConfirm) return;
    try {
      setIsDeletingJob(true);
      const { jobId, jobName } = deleteJobConfirm;
      const res = await deleteJob(workOrder.id, jobId);
      if (res.success) {
        toast.success(`Đã xóa công việc "${jobName}"`);
        setDeleteJobConfirm(null);
        loadInspection();
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xóa công việc');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi xóa công việc');
    } finally {
      setIsDeletingJob(false);
    }
  };

  const updateFindingNote = useCallback((id: number, note: string) => {
    if (isReadOnly) return;

    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description: note } : f))
    );

    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await updateFinding(workOrder.id, id, { description: note });
      } catch (err: any) {
        toast.error('Không thể tự động lưu ghi chú');
      }
    }, 600);
  }, [isReadOnly, workOrder.id]);

  // Kích hoạt upload ảnh
  const triggerUploadPhoto = useCallback((findingId: number) => {
    if (isReadOnly) return;
    targetFindingIdRef.current = findingId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [isReadOnly]);

  const handleOpenJobModal = useCallback((finding: InspectionFinding, job: any | null) => {
    setSelectedFindingForJobModal(finding);
    setSelectedJobForModal(job);
    setIsJobModalOpen(true);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    const findingId = targetFindingIdRef.current;
    if (!rawFile || !findingId) return;

    const targetFinding = findings.find((f) => f.id === findingId);
    if (!targetFinding) {
      toast.error('Điểm đánh dấu này không còn tồn tại');
      return;
    }

    const toastId = toast.loading('Đang nén và tải ảnh lên...');
    try {
      setUploadingFindingId(findingId);

      // 1. Nén ảnh phía client (giảm dung lượng còn vài trăm KB để upload cực nhanh)
      const compressed = await compressImage(rawFile);

      // 2. Tải ảnh lên máy chủ
      const url = await uploadFindingPhoto(compressed);

      // 3. Cập nhật danh sách URL ảnh cho Finding
      const currentUrls = targetFinding.evidence_urls || [];
      const updatedUrls = [...currentUrls, url];

      const res = await updateFinding(workOrder.id, findingId, {
        evidence_urls: updatedUrls,
      });

      if (res.success && res.data) {
        setFindings((prev) =>
          prev.map((f) => (f.id === findingId ? res.data : f))
        );
        toast.success('Đã tải lên ảnh minh chứng thành công', { id: toastId });
      } else {
        toast.error('Không thể lưu ảnh cho điểm đánh dấu này', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên', { id: toastId });
    } finally {
      setUploadingFindingId(null);
      targetFindingIdRef.current = null;
    }
  };

  const tools: {
    type: MarkerType;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    lightBg: string;
  }[] = [
    { type: 'DAMAGE', label: 'Hư hỏng', icon: 'X', color: 'text-[#B22222]', bgColor: 'bg-[#B22222]', borderColor: 'border-[#B22222]', lightBg: 'bg-[#FCE8E8]' },
    { type: 'RUST', label: 'Rỉ sét', icon: 'R', color: 'text-[#B8860B]', bgColor: 'bg-[#B8860B]', borderColor: 'border-[#B8860B]', lightBg: 'bg-[#FDF6E3]' },
    { type: 'MISSING', label: 'Thiếu', icon: 'M', color: 'text-[#1E40AF]', bgColor: 'bg-[#1E40AF]', borderColor: 'border-[#1E40AF]', lightBg: 'bg-[#EFF6FF]' },
    { type: 'DENT', label: 'Móp méo', icon: 'D', color: 'text-[#4682B4]', bgColor: 'bg-[#4682B4]', borderColor: 'border-[#4682B4]', lightBg: 'bg-[#E5F0F9]' },
    { type: 'SCRATCH', label: 'Trầy xước', icon: 'S', color: 'text-[#708090]', bgColor: 'bg-[#708090]', borderColor: 'border-[#708090]', lightBg: 'bg-[#F1F5F9]' },
  ];

  // Map backend findings sang SVG finding format
  const svgFindings: SvgFinding[] = useMemo(() => findings.map((f) => {
    const jobNames: string[] = [];
    f.job_findings?.forEach((jf) => {
      if (jf.job?.name && !jobNames.includes(jf.job.name)) {
        jobNames.push(jf.job.name);
      }
    });
    workOrder?.services?.forEach((srv) => {
      srv.jobs?.forEach((job) => {
        if (job.findings?.some((item: any) => item.finding_id === f.id || item.finding?.id === f.id)) {
          if (!jobNames.includes(job.name)) jobNames.push(job.name);
        }
      });
    });

    return {
      id: f.id,
      type: f.marker_type,
      partId: f.coordinates?.part_id || '',
      partName: f.part_name,
      x: f.coordinates?.x ?? 50,
      y: f.coordinates?.y ?? 50,
      note: f.description || '',
      photos: f.evidence_urls || [],
      jobName: jobNames.join(', ') || undefined,
      jobNames: jobNames.length > 0 ? jobNames : undefined,
    };
  }), [findings, workOrder?.services]);

  // Tổng số ảnh đã chụp
  const totalPhotos = findings.reduce(
    (acc, f) => acc + (f.evidence_urls?.length || 0),
    0
  );

  // Danh sách tất cả những người tham gia kiểm tra (Advisor + những ai đã tạo điểm ghi nhận)
  const inspectors = React.useMemo(() => {
    const map = new Map<number, string>();
    if (workOrder?.advisor?.id && workOrder?.advisor?.full_name) {
      map.set(workOrder.advisor.id, workOrder.advisor.full_name);
    }
    if (inspection?.created_by?.id && inspection?.created_by?.full_name) {
      map.set(inspection.created_by.id, inspection.created_by.full_name);
    }
    findings.forEach((f) => {
      if (f.created_by?.id && f.created_by?.full_name) {
        map.set(f.created_by.id, f.created_by.full_name);
      }
    });

    const list = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    return list.length > 0 ? list : [{ id: 0, name: workOrder?.advisor?.full_name || 'Cố vấn dịch vụ' }];
  }, [workOrder, inspection, findings]);

  // Tính toán thời gian cập nhật/sửa chữa lần cuối
  const lastModifiedTime = React.useMemo(() => {
    const dates: number[] = [];
    if (inspection?.updated_at) dates.push(new Date(inspection.updated_at).getTime());
    if (inspection?.created_at) dates.push(new Date(inspection.created_at).getTime());
    if (workOrder?.updated_at) dates.push(new Date(workOrder.updated_at).getTime());
    if (workOrder?.created_at) dates.push(new Date(workOrder.created_at).getTime());

    findings.forEach((f) => {
      if (f.updated_at) dates.push(new Date(f.updated_at).getTime());
      if (f.created_at) dates.push(new Date(f.created_at).getTime());
    });

    const validDates = dates.filter((d) => !isNaN(d));
    if (validDates.length === 0) return new Date().toLocaleString('vi-VN');
    return new Date(Math.max(...validDates)).toLocaleString('vi-VN');
  }, [inspection, workOrder, findings]);

  return (
    <div className="flex flex-col gap-4 mt-6">
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Section */}
      <div className="flex flex-col gap-3 pb-2 border-b border-outline-variant/50">
        <h3 className="text-[12px] font-bold text-on-surface uppercase tracking-wider">
          KIỂM TRA THÂN XE
        </h3>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface mb-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Người kiểm tra:</span>
          {inspectors.length === 1 ? (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-[#0c2340] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-2xs">
                {inspectors[0].name[0].toUpperCase()}
              </span>
              <span className="font-semibold">{inspectors[0].name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2" title={inspectors.map((i) => i.name).join(', ')}>
              <div className="flex -space-x-1.5">
                {inspectors.slice(0, 3).map((insp, idx) => (
                  <span
                    key={insp.id}
                    className="w-5 h-5 bg-[#0c2340] text-white rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs"
                    title={insp.name}
                  >
                    {insp.name[0].toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="font-semibold">
                {inspectors.map((i) => i.name).join(', ')}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                {inspectors.length} người
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Cập nhật lần cuối:</span>
          <span className="font-medium text-on-surface">
            {lastModifiedTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Số điểm đánh dấu:</span>
          <span className="font-bold text-primary">
            {findings.length} điểm
          </span>
        </div>
      </div>



      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isReadOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-slate-500">lock</span>
              <span>
                Đã khóa sơ đồ kiểm tra ({workOrder?.status === 'FINANCIAL_CLEARED' ? 'Chờ giao xe' : workOrder?.status === 'APPROVED' ? 'Đã duyệt báo giá' : workOrder?.status === 'IN_PROGRESS' ? 'Đang sửa chữa' : workOrder?.status === 'BILLING_REQUESTED' ? 'Chờ thanh toán' : 'Chỉ xem'})
              </span>
            </div>
          ) : (
            tools.map((tool) => {
              const isSelected = selectedTool === tool.type;
              return (
                <button
                  key={tool.type}
                  type="button"
                  onClick={() => setSelectedTool(isSelected ? null : tool.type)}
                  className={`sa-press flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#0050cd] text-[#0050cd] bg-blue-50/70 ring-2 ring-[#0050cd]/25'
                      : 'border-slate-200 text-slate-700 bg-slate-50/80 hover:bg-slate-100'
                  }`}
                >
                  <span className={`min-w-[18px] h-[18px] px-0.5 rounded-full flex items-center justify-center text-[11px] leading-none text-white ${tool.bgColor}`}>
                    {tool.icon}
                  </span>
                  {tool.label}
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="sa-press flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0050cd]">history</span>
            Nhật ký kiểm tra
            <span className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums">
              {findings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowPhotoLibrary(true)}
            className="sa-press flex items-center gap-2 min-h-[40px] sm:min-h-[44px] px-3 py-1.5 rounded-xl border border-[#0050cd]/40 bg-blue-50/50 text-[#0050cd] text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">photo_library</span>
            Thư viện ảnh
            <span className="bg-[#0050cd] text-white px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums">
              {totalPhotos}
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: SVG Diagram */}
        <div className="w-full xl:w-1/2 flex flex-col">
          <InteractiveCarSVG
            findings={svgFindings}
            selectedTool={isReadOnly ? null : selectedTool}
            onAddFinding={handleAddFinding}
            highlightedFindingId={highlightedFindingId}
            onSelectFinding={handleSelectFinding}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* Right: Findings List (Responsive, Zero Horizontal Scroll) */}
        <InspectionFindingList
          findings={findings}
          tools={tools}
          highlightedFindingId={highlightedFindingId}
          isReadOnly={isReadOnly}
          isApprovedOrBeyond={isApprovedOrBeyond}
          uploadingFindingId={uploadingFindingId}
          loading={loading}
          error={error}
          workOrderServices={workOrder?.services}
          onRetry={loadInspection}
          onHover={setHighlightedFindingId}
          onTriggerUpload={triggerUploadPhoto}
          onRemoveFinding={handleRemoveFinding}
          onNoteChange={updateFindingNote}
          onOpenJobModal={handleOpenJobModal}
          onPromptDeleteJob={promptDeleteJob}
        />
      </div>

      {/* Photo Library Modal */}
      {showPhotoLibrary && (
        <PhotoLibraryModal
          isOpen={showPhotoLibrary}
          onClose={() => setShowPhotoLibrary(false)}
          findings={findings}
          totalPhotos={totalPhotos}
          tools={tools}
          onPreviewImage={setPreviewImage}
        />
      )}

      {/* Log Modal (Nhật ký kiểm tra xe chi tiết) */}
      {showLogModal && (
        <InspectionLogModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          findings={findings}
          inspectors={inspectors}
          totalPhotos={totalPhotos}
          tools={tools}
          advisorName={workOrder?.advisor?.full_name}
          onPreviewImage={setPreviewImage}
        />
      )}

      {/* Image Preview Modal */}
      <ImageLightbox
        src={previewImage}
        ariaLabel="Xem phóng to hình ảnh kiểm tra"
        onClose={() => setPreviewImage(null)}
      />

      {/* Modal Tạo / Xem chi tiết công việc điều phối */}
      {isJobModalOpen && (
        <CreateDispatchJobModal
          isOpen={isJobModalOpen}
          onClose={() => {
            setIsJobModalOpen(false);
            setSelectedJobForModal(null);
            setSelectedFindingForJobModal(null);
          }}
          workOrder={workOrder}
          finding={selectedFindingForJobModal}
          job={selectedJobForModal}
          onSuccess={() => {
            loadInspection();
            if (refetchWO) refetchWO();
          }}
        />
      )}

      {/* Modal xác nhận xóa công việc chuyên nghiệp thay cho alert/confirm */}
      <ConfirmModal
        isOpen={!!deleteJobConfirm}
        title="Xác nhận xóa công việc"
        message={
          deleteJobConfirm
            ? `Bạn có chắc chắn muốn xóa công việc "${deleteJobConfirm.jobName}" khỏi phiếu sửa chữa? Công việc sẽ được gỡ khỏi danh sách hạng mục và hủy liên kết với các điểm đánh dấu trên xe.`
            : ''
        }
        confirmText={isDeletingJob ? 'Đang xóa...' : 'Xác nhận xóa'}
        cancelText="Hủy bỏ"
        isDestructive
        onConfirm={() => {
          if (!isDeletingJob) handleExecuteDeleteJob();
        }}
        onCancel={() => {
          if (!isDeletingJob) setDeleteJobConfirm(null);
        }}
      />
    </div>
  );
}

