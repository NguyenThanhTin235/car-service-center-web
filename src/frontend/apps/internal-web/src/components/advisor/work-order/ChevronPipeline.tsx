'use client';
import React from 'react';

type Props = {
  statuses: string[];
  currentStatus: string;
  compact?: boolean;
};

export default function ChevronPipeline({ statuses, currentStatus, compact = false }: Props) {
  const currentIndex = statuses.indexOf(currentStatus);
  const arrowCut = compact ? 8 : 12;

  return (
    <div
      data-testid="wo-chevron-pipeline"
      className={`flex items-center rounded-xl overflow-hidden select-none ${
        compact ? 'h-[30px] text-[11px]' : 'h-[34px] text-label-sm font-label-sm'
      }`}
    >
      {statuses.map((status, index) => {
        const isCurrent = index === currentIndex;
        const isPast = currentIndex !== -1 && index < currentIndex;
        const isFirst = index === 0;
        const isLast = index === statuses.length - 1;

        let bgClass = '';
        let textClass = '';

        if (isCurrent) {
          bgClass = 'bg-[#0050cd]';
          textClass = 'text-white font-extrabold';
        } else if (isPast) {
          bgClass = 'bg-[#0866ff]';
          textClass = 'text-white font-bold';
        } else {
          bgClass = 'bg-slate-100 hover:bg-slate-200';
          textClass = 'text-slate-400 font-semibold';
        }

        // Polygon paths for the chevron shape
        let clipPath = `polygon(0 0, calc(100% - ${arrowCut}px) 0, 100% 50%, calc(100% - ${arrowCut}px) 100%, 0 100%, ${arrowCut}px 50%)`;
        if (isFirst) {
          clipPath = `polygon(0 0, calc(100% - ${arrowCut}px) 0, 100% 50%, calc(100% - ${arrowCut}px) 100%, 0 100%)`;
        }
        if (isLast) {
          clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${arrowCut}px 50%)`;
        }

        return (
          <div
            key={status}
            className={`relative flex items-center h-full ${
              !isFirst ? (compact ? '-ml-[8px]' : '-ml-[12px]') : ''
            }`}
            style={{ zIndex: statuses.length - index }}
          >
            <div
              className={`h-full flex items-center justify-center ${
                compact ? 'pl-3 pr-4' : 'pl-5 pr-7'
              } ${bgClass} ${textClass} transition-colors border-r border-white/60`}
              style={{ clipPath }}
            >
              <span className="font-bold uppercase tracking-wider whitespace-nowrap text-[11px]">
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
