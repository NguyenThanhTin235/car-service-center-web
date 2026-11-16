'use client';
import React, { useState, useEffect, useRef } from 'react';
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
import CreateDispatchJobModal from '../modals/CreateDispatchJobModal';
import { PhotoLibraryModal, InspectionLogModal } from '../modals/InspectionSubModals';
import ConfirmModal from '@/components/shared/ConfirmModal';
import toast from 'react-hot-toast';

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

  // Fetch inspection data on mount or when workOrder.id changes
  useEffect(() => {
    if (!workOrder?.id) return;
    loadInspection();
  }, [workOrder?.id]);

  const loadInspection = async () => {
    try {
      if (findings.length === 0) {
        setLoading(true);
      }
      const res = await getInspection(workOrder.id);
      if (res.success && res.data) {
        setInspection(res.data);
        setFindings(res.data.findings || []);
      }
    } catch (err: any) {
      console.error('Lỗi tải thông tin kiểm tra xe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinding = async (findingData: Omit<SvgFinding, 'id'>) => {
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
    } finally {
      setSelectedTool(null);
    }
  };


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

  const promptDeleteJob = (jobId: number, jobName: string) => {
    if (isReadOnly || isApprovedOrBeyond) {
      toast.error('Không thể xóa công việc khi báo giá đã được khách hàng phê duyệt.');
      return;
    }
    setDeleteJobConfirm({ jobId, jobName });
  };

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

  const updateFindingNote = (id: number, note: string) => {
    if (isReadOnly) return;

    // Cập nhật UI ngay lập tức
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, description: note } : f))
    );

    // Xóa timer cũ nếu còn
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    // Auto-save sau 600ms không gõ
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await updateFinding(workOrder.id, id, { description: note });
      } catch (err: any) {
        toast.error('Không thể tự động lưu ghi chú');
      }
    }, 600);
  };

  // Kích hoạt upload ảnh
  const triggerUploadPhoto = (findingId: number) => {
    if (isReadOnly) return;
    targetFindingIdRef.current = findingId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

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
  const svgFindings: SvgFinding[] = findings.map((f) => {
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
  });

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
              <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
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
                  onClick={() => setSelectedTool(isSelected ? null : tool.type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                    isSelected
                      ? 'border-[#2563EB] text-[#000080] bg-white ring-2 ring-[#2563EB]/30'
                      : 'border-outline-variant text-on-surface-variant bg-white hover:bg-surface-container-low'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white ${tool.bgColor}`}>
                    {tool.icon}
                  </span>
                  {tool.label}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-outline-variant bg-white text-on-surface-variant text-[11px] font-bold hover:bg-[#F8F9FA] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-[#4682B4]">history</span>
            Nhật ký kiểm tra
            <span className="bg-surface-variant text-on-surface px-1.5 py-0.2 rounded text-[10px] font-bold">
              {findings.length}
            </span>
          </button>

          <button
            onClick={() => setShowPhotoLibrary(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#2563EB] bg-white text-[#2563EB] text-[11px] font-bold hover:bg-[#F8F9FA] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">photo_library</span>
            Thư viện ảnh
            <span className="bg-[#2563EB] text-white px-1.5 py-0.2 rounded text-[10px] font-bold">
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
            onSelectFinding={(id) => {
              if (id === '' || id === null || id === undefined) {
                setHighlightedFindingId(null);
                return;
              }
              const numericId = Number(id);
              setHighlightedFindingId((prev) => (prev === numericId ? null : numericId));
            }}
            isReadOnly={isReadOnly}
          />

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-700 font-semibold">
            <span className="font-bold text-zinc-900">Chú thích:</span>
            <span className="inline-flex items-center gap-1.5 text-[#B22222] font-bold">
              <span className="w-4 h-4 rounded-full bg-[#B22222] text-white flex items-center justify-center text-[10px]">X</span>
              Hư hỏng
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#B8860B] font-bold">
              <span className="w-4 h-4 rounded-full bg-[#B8860B] text-white flex items-center justify-center text-[10px]">R</span>
              Rỉ sét
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#1E40AF] font-bold">
              <span className="w-4 h-4 rounded-full bg-[#1E40AF] text-white flex items-center justify-center text-[10px]">M</span>
              Thiếu
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#0284c7] font-bold">
              <span className="w-4 h-4 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-[10px]">D</span>
              Móp méo
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#475569] font-bold">
              <span className="w-4 h-4 rounded-full bg-[#475569] text-white flex items-center justify-center text-[10px]">S</span>
              Trầy xước
            </span>
          </div>
        </div>

        {/* Right: Findings List */}
        <div className="w-full xl:w-1/2 bg-white flex flex-col pt-1 border border-outline-variant/40 rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-outline-variant/30">
            <span className="text-[12px] font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">format_list_bulleted</span>
              Danh sách ghi nhận kiểm tra ({findings.length})
            </span>
          </div>

          <div className="md:overflow-x-auto">
            <div className={`hidden md:grid ${isReadOnly ? 'md:grid-cols-[32px_96px_125px_minmax(160px,1fr)_145px_40px]' : 'md:grid-cols-[32px_96px_125px_minmax(160px,1fr)_145px_40px_36px]'} gap-2 pb-2.5 border-b border-slate-200 text-xs text-slate-500 font-bold items-center`}>
              <div className="text-center font-mono">#</div>
              <div className="whitespace-nowrap">Loại dấu vết</div>
              <div className="whitespace-nowrap">Vị trí bộ phận</div>
              <div className="whitespace-nowrap">Ghi chú</div>
              <div className="text-center whitespace-nowrap">Công việc</div>
              <div className="text-center whitespace-nowrap">Ảnh</div>
              {!isReadOnly && <div></div>}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 styled-scrollbar flex flex-col">
            {loading && findings.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-on-surface-variant text-[11px] gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Đang tải dữ liệu kiểm tra xe...
              </div>
            ) : findings.length === 0 ? (
              <div className="text-center text-on-surface-variant text-[11px] italic py-12">
                Chưa có ghi nhận hư hại nào. Chọn loại dấu vết và nhấp vào sơ đồ xe bên trái để thêm.
              </div>
            ) : (
              findings.map((finding, index) => {
                const toolDef = tools.find((t) => t.type === finding.marker_type);
                const isHighlighted = highlightedFindingId === finding.id;
                
                // Thu thập TẤT CẢ các công việc liên kết với finding này (từ job_findings và từ workOrder.services)
                const linkedJobsMap = new Map<number, { id: number; name: string; status?: string; serviceName?: string; fullJob?: any }>();

                finding.job_findings?.forEach((jf) => {
                  if (jf.job) {
                    linkedJobsMap.set(jf.job.id, {
                      id: jf.job.id,
                      name: jf.job.name,
                      status: (jf.job as any).status,
                      fullJob: jf.job,
                    });
                  }
                });

                workOrder?.services?.forEach((srv) => {
                  srv.jobs?.forEach((job) => {
                    const isMatched = job.findings?.some(
                      (f: any) => f.finding_id === finding.id || f.finding?.id === finding.id
                    );
                    if (isMatched) {
                      linkedJobsMap.set(job.id, {
                        id: job.id,
                        name: job.name,
                        status: job.status,
                        serviceName: srv.name,
                        fullJob: job,
                      });
                    }
                  });
                });

                const allLinkedJobs = Array.from(linkedJobsMap.values());
                const isLinkedToJob = allLinkedJobs.length > 0;
                const photoCount = finding.evidence_urls?.length || 0;

                return (
                  <div
                    key={finding.id}
                    onMouseEnter={() => setHighlightedFindingId(finding.id)}
                    onMouseLeave={() => setHighlightedFindingId(null)}
                    className={`flex flex-col gap-2.5 p-3 mb-2 rounded-xl border border-slate-200/80 bg-slate-50/40 md:mb-0 md:p-0 md:rounded md:border-0 md:border-b md:border-slate-100 md:bg-transparent md:grid ${isReadOnly ? 'md:grid-cols-[32px_96px_125px_minmax(160px,1fr)_145px_40px]' : 'md:grid-cols-[32px_96px_125px_minmax(160px,1fr)_145px_40px_36px]'} md:gap-2 md:items-center md:py-2.5 group transition-colors ${
                      isHighlighted ? 'bg-primary/5 md:bg-primary/5' : 'md:hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Tier 1 on <md: # + Badge + Part Name (left), Photo + Delete (right) */}
                    <div className="flex items-center justify-between gap-2 md:contents">
                      <div className="flex items-center gap-2 min-w-0 md:contents">
                        <div className="text-slate-500 font-mono font-bold text-xs md:text-center shrink-0 md:order-1">
                          {index + 1}
                        </div>

                        <div className="shrink-0 md:order-2">
                          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${toolDef?.lightBg}`}>
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold ${toolDef?.bgColor}`}>
                              {toolDef?.icon}
                            </span>
                            <span className={`text-xs font-bold ${toolDef?.color}`}>{toolDef?.label}</span>
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0 md:order-3">
                          <span className="text-xs font-bold text-zinc-900 leading-snug truncate md:whitespace-normal">
                            {finding.part_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 md:contents">
                        {/* Photo upload */}
                        <div className="flex items-center justify-center md:order-6">
                          <button
                            onClick={() => triggerUploadPhoto(finding.id)}
                            disabled={isReadOnly || uploadingFindingId === finding.id}
                            title={photoCount > 0 ? `${photoCount} ảnh minh chứng` : 'Tải ảnh minh chứng'}
                            className={`relative p-1.5 rounded hover:bg-surface-container transition-colors ${
                              photoCount > 0 ? 'text-[#2563EB]' : 'text-on-surface-variant'
                            } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {uploadingFindingId === finding.id ? (
                              <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">
                                {photoCount > 0 ? 'image' : 'add_a_photo'}
                              </span>
                            )}
                            {photoCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-[#2563EB] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                {photoCount}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Remove / Lock button */}
                        {!isReadOnly && (
                          <div className="flex items-center justify-center md:order-7">
                            <button
                              onClick={() => handleRemoveFinding(finding.id)}
                              title={
                                isLinkedToJob
                                  ? 'Không thể xóa vì đã liên kết với công việc'
                                  : 'Xóa đánh dấu'
                              }
                              className={`p-1.5 transition-all ${
                                isLinkedToJob
                                  ? 'text-outline/40 hover:text-outline cursor-not-allowed'
                                  : 'opacity-100 xl:opacity-0 xl:group-hover:opacity-100 text-outline hover:text-error cursor-pointer'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isLinkedToJob ? 'lock' : 'close'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tier 2 on <md: Notes input + Linked jobs */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:contents">
                      <div className="flex-1 min-w-0 md:order-4">
                        {!isReadOnly ? (
                          <input
                            type="text"
                            placeholder="Thêm ghi chú..."
                            value={finding.description || ''}
                            onChange={(e) => updateFindingNote(finding.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder:text-outline bg-white"
                          />
                        ) : (
                          <p className="text-xs text-slate-600 italic">
                            {finding.description || '—'}
                          </p>
                        )}
                      </div>

                      {/* Job linking - Hiển thị toàn bộ công việc lên bảng & Nút thêm job trực tiếp */}
                      <div className="flex flex-col items-center justify-center text-center w-full sm:w-40 md:w-full shrink-0 md:order-5">
                        {allLinkedJobs.length > 0 ? (
                          <div className="flex flex-col gap-1 w-full items-stretch">
                            {allLinkedJobs.map((job) => (
                              <div
                                key={job.id}
                                onClick={() => {
                                  setSelectedJobForModal(job.fullJob || job);
                                  setSelectedFindingForJobModal(finding);
                                  setIsJobModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold max-w-full text-left transition-colors cursor-pointer active:scale-98"
                                title={`Nhấn để xem thông tin chi tiết công việc: ${job.name}`}
                              >
                                <span className="material-symbols-outlined text-[12px] text-emerald-600 shrink-0">
                                  build_circle
                                </span>
                                <span className="truncate flex-1 font-semibold">{job.name}</span>
                                {job.status && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                    {job.status === 'PLANNED' ? 'Mới' : job.status === 'IN_PROGRESS' ? 'Đang làm' : job.status === 'PASSED' ? 'Đạt KCS' : job.status}
                                  </span>
                                )}
                                {!isReadOnly && !isApprovedOrBeyond && (job.status === 'PLANNED' || !job.status) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      promptDeleteJob(job.id, job.name);
                                    }}
                                    className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                    title={`Xóa công việc "${job.name}"`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                  </button>
                                )}
                              </div>
                            ))}
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFindingForJobModal(finding);
                                  setSelectedJobForModal(null);
                                  setIsJobModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 mt-1 rounded-md border border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-600 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap w-full"
                                title="Thêm công việc khác trực tiếp cho dấu vết này"
                              >
                                <span className="material-symbols-outlined text-[12px] text-emerald-600">add_circle</span>
                                + Thêm job
                              </button>
                            )}
                          </div>
                        ) : !isReadOnly ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFindingForJobModal(finding);
                              setSelectedJobForModal(null);
                              setIsJobModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 hover:border-emerald-500 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap w-full"
                            title="Tạo và liên kết công việc trực tiếp cho dấu vết này"
                          >
                            <span className="material-symbols-outlined text-[13px] text-emerald-600">add_circle</span>
                            + Thêm job
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic font-medium">
                            Chưa gắn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Library Modal */}
      <PhotoLibraryModal
        isOpen={showPhotoLibrary}
        onClose={() => setShowPhotoLibrary(false)}
        findings={findings}
        totalPhotos={totalPhotos}
        tools={tools}
        onPreviewImage={setPreviewImage}
      />

      {/* Log Modal (Nhật ký kiểm tra xe chi tiết) */}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img
            src={previewImage}
            alt="Xem ảnh phóng to"
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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

