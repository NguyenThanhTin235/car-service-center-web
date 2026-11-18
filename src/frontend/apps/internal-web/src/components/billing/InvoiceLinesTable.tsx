'use client';

import React, { useState, useEffect } from 'react';
import { InvoiceLine } from '@/lib/api/invoice.api';

interface Props {
  lines: InvoiceLine[];
  pageSize?: number;
}

export default function InvoiceLinesTable({ lines, pageSize = 5 }: Props) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(lines.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [lines.length]);

  const pagedLines = lines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'LABOUR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 whitespace-nowrap">
            Công thợ
          </span>
        );
      case 'PART':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 whitespace-nowrap">
            Phụ tùng
          </span>
        );
      case 'MATERIAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 whitespace-nowrap">
            Vật tư
          </span>
        );
      case 'PACKAGE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 whitespace-nowrap">
            Gói trọn gói
          </span>
        );
      case 'FEE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap">
            Phí dịch vụ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
      <table className="w-full text-left text-sm min-w-[700px]">
        <thead className="bg-surface-container-low text-on-surface-variant font-semibold text-xs uppercase tracking-wider border-b border-outline-variant">
          <tr>
            <th className="py-3.5 px-3 w-14 text-center whitespace-nowrap">STT</th>
            <th className="py-3.5 px-4 min-w-[220px]">Nội dung hạng mục</th>
            <th className="py-3.5 px-3 w-32 text-center whitespace-nowrap">Phân loại</th>
            <th className="py-3.5 px-3 w-24 text-center whitespace-nowrap">Số lượng</th>
            <th className="py-3.5 px-4 w-36 text-right whitespace-nowrap">Đơn giá</th>
            <th className="py-3.5 px-4 w-40 text-right whitespace-nowrap">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                Chưa có dòng chi phí nào.
              </td>
            </tr>
          ) : (
            pagedLines.map((line, idx) => {
              const rowSTT = (currentPage - 1) * pageSize + idx + 1;
              return (
                <tr key={line.id || rowSTT} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-3 text-center text-on-surface-variant font-medium whitespace-nowrap">
                    {rowSTT}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-on-surface leading-snug">{line.description}</div>
                    {line.serviceName && (
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        Thuộc: <span className="font-medium text-on-surface">{line.serviceName}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {renderTypeBadge(line.lineType)}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-on-surface whitespace-nowrap">
                    {line.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right text-on-surface-variant font-medium whitespace-nowrap">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-on-surface whitespace-nowrap">
                    {formatMoney(line.amount)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-t border-outline-variant bg-surface-container-low/70 text-xs text-on-surface-variant gap-2">
          <span>
            Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, lines.length)}</strong> /{' '}
            <strong>{lines.length}</strong> hạng mục (Trang {currentPage}/{totalPages})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              <span>Trước</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === num
                      ? 'bg-primary text-white shadow-xs'
                      : 'border border-outline-variant hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs"
            >
              <span>Sau</span>
              <span className="material-symbols-outlined text-[15px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
