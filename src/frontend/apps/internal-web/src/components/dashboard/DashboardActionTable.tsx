'use client';

import React, { useState, useMemo } from 'react';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
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
  const currentData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

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
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-2 pointer-events-none">
            search
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
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
                  }`}
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
                    <td key={col.key} className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
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
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, processedData.length)} trên tổng {processedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
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
