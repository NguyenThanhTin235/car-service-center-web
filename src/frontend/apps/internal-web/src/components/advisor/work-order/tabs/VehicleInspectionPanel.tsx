'use client';
import React, { useState, useEffect, useRef } from 'react';
import InteractiveCarSVG, { Finding as SvgFinding, MarkerType } from './InteractiveCarSVG';
import { WorkOrder } from '@/lib/api/work-order.api';
import {
  getInspection,
  createFinding,
  updateFinding,
  deleteFinding,
  uploadFindingPhoto,
  InspectionFinding,
} from '@/lib/api/inspection.api';
import toast from 'react-hot-toast';

interface VehicleInspectionPanelProps {
  workOrder: WorkOrder;
  isReadOnly?: boolean;
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
  isReadOnly = false,
}: VehicleInspectionPanelProps) {
  const [selectedTool, setSelectedTool] = useState<MarkerType | null>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedFindingId, setHighlightedFindingId] = useState<number | null>(null);

  // Uploading state
  const [uploadingFindingId, setUploadingFindingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetFindingIdRef = useRef<number | null>(null);

  // Photo library modal & preview
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      setLoading(true);
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
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu đánh dấu kiểm tra xe');
    } finally {
      setSelectedTool(null);
    }
  };

  const handleRemoveFinding = async (id: number) => {
    if (isReadOnly) return;

    // Kiểm tra ràng buộc phía Client trước khi gọi API (Luồng ngoại lệ UC-33)
    const targetFinding = findings.find((f) => f.id === id);
    if (targetFinding?.job_findings && targetFinding.job_findings.length > 0) {
      const jobName =
        targetFinding.job_findings[0]?.job?.name ||
        `Công việc #${targetFinding.job_findings[0]?.job_id}`;
      toast.error(
        `Không thể xóa: Điểm đánh dấu này đã được liên kết với "${jobName}". Vui lòng hủy liên kết với công việc trước.`,
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
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh dấu kiểm tra xe');
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
    { type: 'MISSING', label: 'Thiếu', icon: 'M', color: 'text-[#6A5ACD]', bgColor: 'bg-[#6A5ACD]', borderColor: 'border-[#6A5ACD]', lightBg: 'bg-[#EAE6F9]' },
    { type: 'DENT', label: 'Móp méo', icon: 'D', color: 'text-[#4682B4]', bgColor: 'bg-[#4682B4]', borderColor: 'border-[#4682B4]', lightBg: 'bg-[#E5F0F9]' },
    { type: 'SCRATCH', label: 'Trầy xước', icon: 'S', color: 'text-[#708090]', bgColor: 'bg-[#708090]', borderColor: 'border-[#708090]', lightBg: 'bg-[#F1F5F9]' },
  ];

  // Map backend findings sang SVG finding format
  const svgFindings: SvgFinding[] = findings.map((f) => ({
    id: f.id,
    type: f.marker_type,
    partId: f.coordinates?.part_id || '',
    partName: f.part_name,
    x: f.coordinates?.x ?? 50,
    y: f.coordinates?.y ?? 50,
    note: f.description || '',
    photos: f.evidence_urls || [],
    jobName: f.job_findings?.[0]?.job?.name,
  }));

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

  // Danh sách log sắp xếp mới nhất lên đầu tiên (theo updated_at hoặc created_at)
  const sortedLogFindings = React.useMemo(() => {
    return findings
      .map((f, originalIndex) => ({
        ...f,
        originalIndex: originalIndex + 1,
        latestTime: new Date(f.updated_at || f.created_at || 0).getTime(),
      }))
      .sort((a, b) => b.latestTime - a.latestTime);
  }, [findings]);

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
          <span className="text-on-surface-variant font-medium">Người kiểm tra:</span>
          {inspectors.length === 1 ? (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-[#20B2AA] text-white rounded flex items-center justify-center font-bold text-[10px]">
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
                    className="w-5 h-5 bg-[#20B2AA] text-white rounded-full flex items-center justify-center font-bold text-[9px] ring-2 ring-white shadow-xs"
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
          <span className="text-on-surface-variant font-medium">Cập nhật lần cuối:</span>
          <span className="font-medium text-on-surface">
            {lastModifiedTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-medium">Số điểm đánh dấu:</span>
          <span className="font-bold text-primary">
            {findings.length} điểm
          </span>
        </div>
      </div>

      <div className="bg-[#F8F9FA] rounded-md p-2.5 flex items-center gap-3 text-[11px] text-on-surface-variant mb-1 border border-outline-variant/40">
        <div className="w-5 h-5 bg-[#6A5ACD] text-white flex items-center justify-center rounded-sm shrink-0">
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
        </div>
        <p>
          Chọn một loại dấu vết hư hỏng trên thanh công cụ, sau đó nhấp vào vị trí bộ phận tương ứng trên sơ đồ xe để ghi nhận. Mỗi điểm đánh dấu có thể ghi chú chi tiết và đính kèm ảnh chụp thực tế.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {tools.map((tool) => {
            const isSelected = selectedTool === tool.type;
            return (
              <button
                key={tool.type}
                onClick={() => !isReadOnly && setSelectedTool(isSelected ? null : tool.type)}
                disabled={isReadOnly}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-bold transition-all shadow-sm ${
                  isSelected
                    ? 'border-[#6A5ACD] text-[#000080] bg-white ring-2 ring-[#6A5ACD]/30'
                    : 'border-outline-variant text-on-surface-variant bg-white hover:bg-surface-container-low'
                } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white ${tool.bgColor}`}>
                  {tool.icon}
                </span>
                {tool.label}
              </button>
            );
          })}
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
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#6A5ACD] bg-white text-[#6A5ACD] text-[11px] font-bold hover:bg-[#F8F9FA] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">photo_library</span>
            Thư viện ảnh
            <span className="bg-[#6A5ACD] text-white px-1.5 py-0.2 rounded text-[10px] font-bold">
              {totalPhotos}
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: SVG Diagram */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <InteractiveCarSVG
            findings={svgFindings}
            selectedTool={selectedTool}
            onAddFinding={handleAddFinding}
            highlightedFindingId={highlightedFindingId}
            onSelectFinding={(id) => setHighlightedFindingId(Number(id))}
          />

          <div className="mt-2.5 flex flex-wrap gap-3 text-[10px] text-on-surface-variant font-medium">
            <span className="font-bold">Chú thích:</span>
            <span className="text-[#B22222]"><strong className="text-black">X</strong> Hư hỏng</span>
            <span className="text-[#B8860B]"><strong className="text-black">R</strong> Rỉ sét</span>
            <span className="text-[#6A5ACD]"><strong className="text-black">M</strong> Thiếu</span>
            <span className="text-[#4682B4]"><strong className="text-black">D</strong> Móp méo</span>
            <span className="text-[#708090]"><strong className="text-black">S</strong> Trầy xước</span>
          </div>
        </div>

        {/* Right: Findings List */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col pt-1 border border-outline-variant/40 rounded-lg p-3">
          <div className="grid grid-cols-[36px_85px_120px_1fr_95px_50px_32px] gap-2 pb-2 border-b border-outline-variant/60 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider items-center">
            <div className="text-center">#</div>
            <div>Loại dấu vết</div>
            <div>Vị trí bộ phận</div>
            <div>Ghi chú chi tiết</div>
            <div className="text-center">Công việc</div>
            <div className="text-center">Ảnh</div>
            <div></div>
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
                const linkedJob = finding.job_findings?.[0]?.job;
                const isLinkedToJob = Boolean(linkedJob || (finding.job_findings && finding.job_findings.length > 0));
                const photoCount = finding.evidence_urls?.length || 0;

                return (
                  <div
                    key={finding.id}
                    onMouseEnter={() => setHighlightedFindingId(finding.id)}
                    onMouseLeave={() => setHighlightedFindingId(null)}
                    className={`grid grid-cols-[36px_85px_120px_1fr_95px_50px_32px] gap-2 items-center py-2.5 border-b border-outline-variant/30 group transition-colors rounded ${
                      isHighlighted ? 'bg-primary/5' : 'hover:bg-surface-container-lowest'
                    }`}
                  >
                    <div className="text-[#4682B4] font-bold text-[11px] text-center">
                      {index + 1}
                    </div>

                    <div>
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${toolDef?.lightBg}`}>
                        <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold ${toolDef?.bgColor}`}>
                          {toolDef?.icon}
                        </span>
                        <span className={`text-[10px] font-bold ${toolDef?.color}`}>{toolDef?.label}</span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-on-surface leading-snug">
                        {finding.part_name}
                      </span>
                    </div>

                    <div>
                      {!isReadOnly ? (
                        <input
                          type="text"
                          placeholder="Thêm ghi chú..."
                          value={finding.description || ''}
                          onChange={(e) => updateFindingNote(finding.id, e.target.value)}
                          className="w-full px-2 py-1 text-[11px] border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder:text-outline bg-white"
                        />
                      ) : (
                        <p className="text-[11px] text-on-surface-variant italic">
                          {finding.description || '—'}
                        </p>
                      )}
                    </div>

                    {/* Job linking */}
                    <div className="flex flex-col items-center justify-center text-center">
                      {linkedJob ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold truncate max-w-full" title={linkedJob.name}>
                          {linkedJob.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant italic">
                          Chưa gắn
                        </span>
                      )}
                    </div>

                    {/* Photo upload */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => triggerUploadPhoto(finding.id)}
                        disabled={isReadOnly || uploadingFindingId === finding.id}
                        title={photoCount > 0 ? `${photoCount} ảnh minh chứng` : 'Tải ảnh minh chứng'}
                        className={`relative p-1 rounded hover:bg-surface-container transition-colors ${
                          photoCount > 0 ? 'text-[#6A5ACD]' : 'text-on-surface-variant'
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
                          <span className="absolute -top-1 -right-1 bg-[#6A5ACD] text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                            {photoCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Remove / Lock button */}
                    <div className="flex items-center justify-center">
                      {!isReadOnly && (
                        <button
                          onClick={() => handleRemoveFinding(finding.id)}
                          title={
                            isLinkedToJob
                              ? 'Không thể xóa vì đã liên kết với công việc'
                              : 'Xóa đánh dấu'
                          }
                          className={`p-1 transition-all ${
                            isLinkedToJob
                              ? 'text-outline/40 hover:text-outline cursor-not-allowed'
                              : 'opacity-0 group-hover:opacity-100 text-outline hover:text-error cursor-pointer'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isLinkedToJob ? 'lock' : 'close'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Photo Library Modal */}
      {showPhotoLibrary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6A5ACD] text-[22px]">photo_library</span>
                <h4 className="text-[14px] font-bold text-on-surface">
                  Thư viện ảnh kiểm tra xe ({totalPhotos} ảnh)
                </h4>
              </div>
              <button
                onClick={() => setShowPhotoLibrary(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto styled-scrollbar flex-1">
              {totalPhotos === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-[12px] italic">
                  Chưa có hình ảnh minh chứng nào được tải lên.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {findings.flatMap((finding, fIndex) =>
                    (finding.evidence_urls || []).map((url, imgIndex) => (
                      <div
                        key={`${finding.id}-${imgIndex}`}
                        className="group relative border border-outline-variant/60 rounded-lg overflow-hidden bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setPreviewImage(url)}
                      >
                        <img
                          src={url}
                          alt={finding.part_name}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="p-2 text-[10px] bg-white border-t border-outline-variant/30 flex flex-col gap-0.5">
                          <span className="font-bold text-primary truncate">
                            #{fIndex + 1} - {finding.part_name}
                          </span>
                          <span className="text-on-surface-variant font-medium">
                            {tools.find(t => t.type === finding.marker_type)?.label || finding.marker_type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-outline-variant/40 bg-surface-container-lowest flex justify-end">
              <button
                onClick={() => setShowPhotoLibrary(false)}
                className="px-4 py-1.5 rounded-md bg-secondary-container text-on-secondary-container font-semibold text-[11px] hover:bg-secondary-container/80 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal (Nhật ký kiểm tra xe chi tiết) */}
      {showLogModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Nhật ký kiểm tra xe
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Lịch sử chi tiết người ghi nhận và thời gian cập nhật từng điểm kiểm tra trên xe (mới nhất ở trên cùng)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Summary Bar */}
            <div className="px-6 py-3 bg-[#F8F9FA] border-b border-outline-variant/40 flex flex-wrap items-center justify-between text-[11px] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-medium">Người tham gia ({inspectors.length}):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {inspectors.map((insp) => (
                    <span
                      key={insp.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-outline-variant/60 font-semibold text-on-surface"
                    >
                      <span className="w-3.5 h-3.5 bg-[#20B2AA] text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                        {insp.name[0].toUpperCase()}
                      </span>
                      {insp.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <span>Tổng số điểm: <strong className="text-primary">{findings.length}</strong></span>
                <span>Tổng số ảnh: <strong className="text-[#6A5ACD]">{totalPhotos}</strong></span>
              </div>
            </div>

            {/* Modal Body: Timeline list */}
            <div className="p-6 overflow-y-auto styled-scrollbar flex-1">
              {sortedLogFindings.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-[12px] italic">
                  Chưa có lịch sử ghi nhận nào cho xe này.
                </div>
              ) : (
                <div className="relative border-l-2 border-outline-variant/60 ml-3 pl-5 space-y-6">
                  {sortedLogFindings.map((f, logIdx) => {
                    const toolDef = tools.find((t) => t.type === f.marker_type);
                    const creatorName = f.created_by?.full_name || workOrder?.advisor?.full_name || 'Cố vấn / KTV';
                    const createdAtStr = f.created_at
                      ? new Date(f.created_at).toLocaleString('vi-VN')
                      : '—';
                    const updatedAtStr = f.updated_at
                      ? new Date(f.updated_at).toLocaleString('vi-VN')
                      : createdAtStr;
                    const linkedJob = f.job_findings?.[0]?.job;

                    return (
                      <div key={f.id} className="relative group">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold shadow-xs ${toolDef?.bgColor || 'bg-primary'}`}>
                          {toolDef?.icon || f.originalIndex}
                        </div>

                        {/* Card Content */}
                        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-outline-variant/30">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[12px] text-primary">
                                Điểm #{f.originalIndex} - {f.part_name}
                              </span>
                              {logIdx === 0 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold">
                                  Mới nhất
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${toolDef?.lightBg} ${toolDef?.color}`}>
                                {toolDef?.label || f.marker_type}
                              </span>
                              {linkedJob && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[11px]">link</span>
                                  {linkedJob.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              <span>Tạo: {createdAtStr}</span>
                              {updatedAtStr !== createdAtStr && (
                                <span className="text-outline">| Sửa: {updatedAtStr}</span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-on-surface-variant font-medium">Người ghi nhận:</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                                  <span className="w-4 h-4 bg-[#20B2AA] text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                    {creatorName[0]?.toUpperCase()}
                                  </span>
                                  {creatorName}
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <span className="text-on-surface-variant font-medium shrink-0">Mô tả chi tiết:</span>
                                <span className="text-on-surface italic">
                                  {f.description ? `"${f.description}"` : 'Không có ghi chú thêm'}
                                </span>
                              </div>
                            </div>

                            {/* Evidence thumbnails */}
                            <div>
                              {f.evidence_urls && f.evidence_urls.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-on-surface-variant font-medium">Ảnh minh chứng:</span>
                                  {f.evidence_urls.map((imgUrl, i) => (
                                    <img
                                      key={i}
                                      src={imgUrl}
                                      alt="Minh chứng"
                                      className="w-10 h-10 object-cover rounded border border-outline-variant hover:scale-105 transition-transform cursor-pointer"
                                      onClick={() => setPreviewImage(imgUrl)}
                                      title="Bấm để xem ảnh phóng to"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-outline italic">Chưa đính kèm ảnh</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-outline-variant/40 bg-surface-container-lowest flex justify-end">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-1.5 rounded-md bg-secondary-container text-on-secondary-container font-semibold text-[11px] hover:bg-secondary-container/80 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
