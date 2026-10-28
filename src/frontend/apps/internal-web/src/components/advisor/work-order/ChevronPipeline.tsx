'use client';
import React from 'react';

type Props = {
  statuses: string[];
  currentStatus: string;
  compact?: boolean;
};

export default function ChevronPipeline({ statuses, currentStatus, compact = false }: Props) {
  const currentIndex = statuses.indexOf(currentStatus);
  const arrowCut = compact ? 10 : 12;

  return (
    <div className={`flex items-center ${compact ? 'h-[28px] text-[11px]' : 'h-[34px] text-label-sm font-label-sm'}`}>
      {statuses.map((status, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;
        const isFirst = index === 0;
        const isLast = index === statuses.length - 1;

        let bgClass = '';
        let textClass = '';

        if (isCurrent) {
          bgClass = 'bg-primary';
          textClass = 'text-white';
        } else if (isPast) {
          bgClass = 'bg-primary-container';
          textClass = 'text-on-primary-container';
        } else {
          bgClass = 'bg-surface-container-high';
          textClass = 'text-on-surface-variant hover:bg-surface-container-highest';
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
            className={`relative flex items-center h-full cursor-pointer ${!isFirst ? (compact ? '-ml-[10px]' : '-ml-[12px]') : ''}`}
            style={{ zIndex: statuses.length - index }}
          >
            <div 
              className={`h-full flex items-center justify-center ${compact ? 'pl-3.5 pr-5' : 'pl-6 pr-8'} ${bgClass} ${textClass} transition-colors border-r-2 border-white`}
              style={{ clipPath }}
            >
              <span className="font-semibold uppercase tracking-wider whitespace-nowrap">
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
