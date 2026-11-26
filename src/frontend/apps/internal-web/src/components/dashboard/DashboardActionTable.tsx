'use client';

import React, { useState, useMemo } from 'react';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DashboardActionTableProps<T> {
  title: string;
  subtitle?: string;
  columns: TableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilterKey?: string;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  headerExtra?: React.ReactNode;
}

export function DashboardActionTable<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  data,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchFilterKey,
  pageSize = 10,
  isLoading = false,
  emptyMessage = 'Không có dữ liệu trong khoảng thời gian này',
  headerExtra,
}: DashboardActionTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Filter & Sort
  const processedData = useMemo(() => {
    let list = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => {
        if (searchFilterKey && item[searchFilterKey]) {
          return String(item[searchFilterKey]).toLowerCase().includes(q);
        }
        return Object.values(item).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      });
    }

    if (sortKey) {
      list.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const cmp = aVal < bVal ? -1 : 1;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [data, search, searchFilterKey, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const safePage = Math.min(page, totalPages);
  const currentData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, safePage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 dark:bg-slate-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {headerExtra}
          <div className="flex items-center gap-2 w-full sm:w-64 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-[#0866ff] transition-colors">
            <span className="material-symbols-outlined text-[16px] leading-none text-slate-400 shrink-0 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="flex-1 min-w-0 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                aria-label="Xóa tìm kiếm"
                className="text-slate-400 hover:text-slate-600 text-xs shrink-0 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-2.5 px-3 font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-[11px] select-none ${
                    col.sortable ? 'cursor-pointer hover:text-slate-900 dark:hover:text-white' : ''
                  } ${col.headerClassName || ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      <span className="text-[12px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentData.length > 0 ? (
              currentData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-2.5 px-3 text-slate-700 dark:text-slate-300 ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">
                      inbox
                    </span>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {processedData.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
          <span>
            Hiển thị {(safePage - 1) * pageSize + 1} -{' '}
            {Math.min(safePage * pageSize, processedData.length)} trên tổng {processedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(Math.min(p, totalPages) - 1, 1))}
              disabled={safePage === 1}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-mono">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.min(p, totalPages) + 1, totalPages))}
              disabled={safePage === totalPages}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
