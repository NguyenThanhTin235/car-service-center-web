import React from 'react';

export interface TablePaginationProps {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  currentCount?: number;
  recordLabel?: string;
  className?: string;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export default function TablePagination({
  totalRecords,
  totalPages,
  currentPage,
  onPageChange,
  currentCount,
  recordLabel = 'bản ghi',
  className = '',
}: TablePaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={`px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/40 ${className}`}
    >
      <span className="text-xs text-slate-500">
        {currentCount !== undefined ? (
          <>
            Hiển thị <span className="font-mono font-bold text-slate-700">{currentCount}</span>{' '}
            trong <span className="font-mono font-bold text-slate-700">{totalRecords}</span>{' '}
            {recordLabel}
          </>
        ) : (
          <>
            Tổng <span className="font-mono font-bold text-slate-700">{totalRecords}</span>{' '}
            {recordLabel}
          </>
        )}
      </span>

      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Trang trước"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="w-8 h-8 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 select-none font-mono"
                >
                  {p}
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                aria-label={`Trang ${p}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0866ff] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="Trang sau"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="w-8 h-8 rounded-lg font-mono text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </nav>
      )}
    </div>
  );
}
