'use client';

import React, { useMemo } from 'react';
import { MarkerType } from '../tabs/InteractiveCarSVG';
import { InspectionFinding } from '@/lib/api/inspection.api';

export interface InspectionToolDef {
  type: MarkerType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  lightBg: string;
}

interface PhotoLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: InspectionFinding[];
  totalPhotos: number;
  tools: InspectionToolDef[];
  onPreviewImage: (url: string) => void;
}

export function PhotoLibraryModal({
  isOpen,
  onClose,
  findings,
  totalPhotos,
  tools,
  onPreviewImage,
}: PhotoLibraryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2563EB] text-[22px]">photo_library</span>
            <h4 className="text-[14px] font-bold text-on-surface">
              Thư viện ảnh kiểm tra xe ({totalPhotos} ảnh)
            </h4>
          </div>
          <button
            onClick={onClose}
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
                    onClick={() => onPreviewImage(url)}
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
                      <span className="text-slate-600 font-medium">
                        {tools.find((t) => t.type === finding.marker_type)?.label || finding.marker_type}
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
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-secondary-container text-on-secondary-container font-semibold text-[11px] hover:bg-secondary-container/80 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

interface InspectionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: InspectionFinding[];
  inspectors: { id: number; name: string }[];
  totalPhotos: number;
  tools: InspectionToolDef[];
  advisorName?: string;
  onPreviewImage: (url: string) => void;
}

export function InspectionLogModal({
  isOpen,
  onClose,
  findings,
  inspectors,
  totalPhotos,
  tools,
  advisorName,
  onPreviewImage,
}: InspectionLogModalProps) {
  // Danh sách log sắp xếp mới nhất lên đầu tiên (theo updated_at hoặc created_at)
  const sortedLogFindings = useMemo(() => {
    return findings
      .map((f, originalIndex) => ({
        ...f,
        originalIndex: originalIndex + 1,
        latestTime: new Date(f.updated_at || f.created_at || 0).getTime(),
      }))
      .sort((a, b) => b.latestTime - a.latestTime);
  }, [findings]);

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Summary Bar */}
        <div className="px-6 py-3 bg-[#F8F9FA] border-b border-outline-variant/40 flex flex-wrap items-center justify-between text-[11px] gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Người tham gia ({inspectors.length}):</span>
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
            <span>Tổng số ảnh: <strong className="text-[#2563EB]">{totalPhotos}</strong></span>
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
                const creatorName = f.created_by?.full_name || advisorName || 'Cố vấn / KTV';
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
                            <span className="text-slate-600 font-medium">Người ghi nhận:</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                              <span className="w-4 h-4 bg-[#20B2AA] text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                {creatorName[0]?.toUpperCase()}
                              </span>
                              {creatorName}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-slate-600 font-medium shrink-0">Mô tả chi tiết:</span>
                            <span className="text-on-surface italic">
                              {f.description ? `"${f.description}"` : 'Không có ghi chú thêm'}
                            </span>
                          </div>
                        </div>

                        {/* Evidence thumbnails */}
                        <div>
                          {f.evidence_urls && f.evidence_urls.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-600 font-medium">Ảnh minh chứng:</span>
                              {f.evidence_urls.map((imgUrl, i) => (
                                <img
                                  key={i}
                                  src={imgUrl}
                                  alt="Minh chứng"
                                  className="w-10 h-10 object-cover rounded border border-outline-variant hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => onPreviewImage(imgUrl)}
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
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-secondary-container text-on-secondary-container font-semibold text-[11px] hover:bg-secondary-container/80 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
