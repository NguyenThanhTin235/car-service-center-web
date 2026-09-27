'use client';
import React from 'react';

type Props = {
  statuses: string[];
  currentStatus: string;
};

export default function ChevronPipeline({ statuses, currentStatus }: Props) {
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="flex items-center h-[34px] text-label-sm font-label-sm">
      {statuses.map((status, index) => {
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;
        const isFuture = index > currentIndex;
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
        let clipPath = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)';
        if (isFirst) {
          clipPath = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)';
        }
        if (isLast) {
          clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)';
        }

        return (
          <div
            key={status}
            className={`relative flex items-center h-full cursor-pointer ${!isFirst ? '-ml-[12px]' : ''}`}
            style={{ zIndex: statuses.length - index }}
          >
            {/* The white border effect can be achieved by an outer wrapper slightly larger, but here we just use the clip-path border hack or rely on a white right border */}
            <div 
              className={`h-full flex items-center justify-center pl-6 pr-8 ${bgClass} ${textClass} transition-colors border-r-2 border-white`}
              style={{ clipPath }}
            >
              <span className={`font-semibold uppercase tracking-wider whitespace-nowrap`}>
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
