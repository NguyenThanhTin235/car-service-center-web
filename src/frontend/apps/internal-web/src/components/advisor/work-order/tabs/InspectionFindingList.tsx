'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WorkOrder } from '@/lib/api/work-order.api';
import { InspectionFinding } from '@/lib/api/inspection.api';
import type { InspectionToolDef } from '../modals/InspectionSubModals';

interface InspectionFindingRowProps {
  finding: InspectionFinding;
  index: number;
  toolDef?: InspectionToolDef;
  isHighlighted: boolean;
  isReadOnly: boolean;
  isApprovedOrBeyond: boolean;
  isUploading: boolean;
  workOrderServices?: WorkOrder['services'];
  onHover: (id: number | null) => void;
  onTriggerUpload: (findingId: number) => void;
  onRemoveFinding: (findingId: number) => void;
  onNoteChange: (findingId: number, note: string) => void;
  onOpenJobModal: (finding: InspectionFinding, job: any | null) => void;
  onPromptDeleteJob: (jobId: number, jobName: string) => void;
}

const InspectionFindingRow = React.memo(function InspectionFindingRow({
  finding,
  index,
  toolDef,
  isHighlighted,
  isReadOnly,
  isApprovedOrBeyond,
  isUploading,
  workOrderServices,
  onHover,
  onTriggerUpload,
  onRemoveFinding,
  onNoteChange,
  onOpenJobModal,
  onPromptDeleteJob,
}: InspectionFindingRowProps) {
  const [localNote, setLocalNote] = useState(finding.description || '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalNote(finding.description || '');
  }, [finding.id, finding.description]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleLocalNoteChange = (val: string) => {
    setLocalNote(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onNoteChange(finding.id, val);
    }, 500);
  };

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (localNote !== (finding.description || '')) {
      onNoteChange(finding.id, localNote);
    }
  };

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

  workOrderServices?.forEach((srv) => {
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
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-colors group ${
        isHighlighted
          ? 'bg-blue-50/70 border-[#0050cd]/30'
          : 'border-slate-200/80 bg-slate-50/40 hover:bg-slate-50'
      }`}
    >
      {/* Tier 1: # + Badge + Part Name (left), Photo + Delete (right) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-slate-500 font-mono font-bold text-xs shrink-0 tabular-nums">
            #{index + 1}
          </div>

          <div className="shrink-0">
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${toolDef?.lightBg}`}>
              <span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] leading-none text-white font-bold ${toolDef?.bgColor}`}>
                {toolDef?.icon}
              </span>
              <span className={`text-xs font-bold ${toolDef?.color}`}>{toolDef?.label}</span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 leading-snug truncate">
              {finding.part_name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onTriggerUpload(finding.id)}
            disabled={isReadOnly || isUploading}
            aria-label={photoCount > 0 ? `${photoCount} ảnh minh chứng` : 'Tải ảnh minh chứng'}
            title={photoCount > 0 ? `${photoCount} ảnh minh chứng` : 'Tải ảnh minh chứng'}
            className={`sa-press relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-200/70 transition-colors ${
              photoCount > 0 ? 'text-[#0050cd]' : 'text-slate-600'
            } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {isUploading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                {photoCount > 0 ? 'image' : 'add_a_photo'}
              </span>
            )}
            {photoCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#0050cd] text-white text-[10px] leading-none font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center tabular-nums">
                {photoCount}
              </span>
            )}
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onRemoveFinding(finding.id)}
              aria-label={
                isLinkedToJob
                  ? 'Không thể xóa vì đã liên kết với công việc'
                  : 'Xóa đánh dấu'
              }
              title={
                isLinkedToJob
                  ? 'Không thể xóa vì đã liên kết với công việc'
                  : 'Xóa đánh dấu'
              }
              className={`sa-press w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isLinkedToJob
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLinkedToJob ? 'lock' : 'close'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tier 2: Notes input + Linked jobs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          {!isReadOnly ? (
            <input
              type="text"
              placeholder="Thêm ghi chú..."
              value={localNote}
              onChange={(e) => handleLocalNoteChange(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:border-[#0050cd] focus:ring-1 focus:ring-[#0050cd] outline-none placeholder:text-slate-400 bg-white"
            />
          ) : (
            <p className="text-xs text-slate-600 italic">
              {finding.description || '—'}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch justify-center w-full sm:w-44 shrink-0">
          {allLinkedJobs.length > 0 ? (
            <div className="flex flex-col gap-1 w-full items-stretch">
              {allLinkedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onOpenJobModal(finding, job.fullJob || job)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold max-w-full text-left transition-colors cursor-pointer"
                  title={`Nhấn để xem thông tin chi tiết công việc: ${job.name}`}
                >
                  <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">
                    build_circle
                  </span>
                  <span className="truncate flex-1 font-semibold">{job.name}</span>
                  {!isReadOnly && !isApprovedOrBeyond && (job.status === 'PLANNED' || !job.status) && (
                    <button
                      type="button"
                      aria-label={`Xóa công việc ${job.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPromptDeleteJob(job.id, job.name);
                      }}
                      className="p-1 rounded hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                      title={`Xóa công việc "${job.name}"`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => onOpenJobModal(finding, null)}
                  className="sa-press inline-flex items-center justify-center gap-1 px-2 py-1.5 mt-0.5 rounded-lg border border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-600 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap w-full"
                  title="Thêm công việc khác trực tiếp cho dấu vết này"
                >
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">add_circle</span>
                  + Thêm công việc
                </button>
              )}
            </div>
          ) : !isReadOnly ? (
            <button
              type="button"
              onClick={() => onOpenJobModal(finding, null)}
              className="sa-press inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 hover:border-emerald-500 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap w-full"
              title="Tạo và liên kết công việc trực tiếp cho dấu vết này"
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-600">add_circle</span>
              + Thêm công việc
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
});

interface InspectionFindingListProps {
  findings: InspectionFinding[];
  tools: InspectionToolDef[];
  highlightedFindingId: number | null;
  isReadOnly: boolean;
  isApprovedOrBeyond: boolean;
  uploadingFindingId: number | null;
  loading: boolean;
  error: string | null;
  workOrderServices?: WorkOrder['services'];
  onRetry: () => void;
  onHover: (id: number | null) => void;
  onTriggerUpload: (findingId: number) => void;
  onRemoveFinding: (findingId: number) => void;
  onNoteChange: (findingId: number, note: string) => void;
  onOpenJobModal: (finding: InspectionFinding, job: any | null) => void;
  onPromptDeleteJob: (jobId: number, jobName: string) => void;
}

export default function InspectionFindingList({
  findings,
  tools,
  highlightedFindingId,
  isReadOnly,
  isApprovedOrBeyond,
  uploadingFindingId,
  loading,
  error,
  workOrderServices,
  onRetry,
  onHover,
  onTriggerUpload,
  onRemoveFinding,
  onNoteChange,
  onOpenJobModal,
  onPromptDeleteJob,
}: InspectionFindingListProps) {
  return (
    <div className="w-full xl:w-1/2 bg-white flex flex-col border border-slate-200/80 rounded-2xl p-3.5">
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/70">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#0050cd] text-[17px]">format_list_bulleted</span>
          Danh sách ghi nhận kiểm tra ({findings.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 styled-scrollbar flex flex-col gap-2.5">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="sa-press px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer self-start sm:self-auto"
            >
              Thử lại
            </button>
          </div>
        ) : loading && findings.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Đang tải dữ liệu kiểm tra xe...
          </div>
        ) : findings.length === 0 ? (
          <div className="text-center text-slate-500 text-xs italic py-12">
            Chưa có ghi nhận hư hại nào. Chọn loại dấu vết và nhấp vào sơ đồ xe bên trái để thêm.
          </div>
        ) : (
          findings.map((finding, index) => (
            <InspectionFindingRow
              key={finding.id}
              finding={finding}
              index={index}
              toolDef={tools.find((t) => t.type === finding.marker_type)}
              isHighlighted={highlightedFindingId === finding.id}
              isReadOnly={isReadOnly}
              isApprovedOrBeyond={isApprovedOrBeyond}
              isUploading={uploadingFindingId === finding.id}
              workOrderServices={workOrderServices}
              onHover={onHover}
              onTriggerUpload={onTriggerUpload}
              onRemoveFinding={onRemoveFinding}
              onNoteChange={onNoteChange}
              onOpenJobModal={onOpenJobModal}
              onPromptDeleteJob={onPromptDeleteJob}
            />
          ))
        )}
      </div>
    </div>
  );
}
