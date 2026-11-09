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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 whitespace-nowrap">
            Công thợ
          </span>
        );
      case 'PART':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
            Phụ tùng
          </span>
        );
      case 'MATERIAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 whitespace-nowrap">
            Vật tư
          </span>
        );
      case 'PACKAGE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 whitespace-nowrap">
            Gói trọn gói
          </span>
        );
      case 'FEE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
            Phí dịch vụ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white">
      <table className="w-full text-left text-xs min-w-[700px]">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/80">
          <tr>
            <th className="py-3 px-3 w-14 text-center whitespace-nowrap">STT</th>
            <th className="py-3 px-4 min-w-[220px]">Nội dung hạng mục</th>
            <th className="py-3 px-3 w-32 text-center whitespace-nowrap">Phân loại</th>
            <th className="py-3 px-3 w-24 text-center whitespace-nowrap">Số lượng</th>
            <th className="py-3 px-4 w-36 text-right whitespace-nowrap">Đơn giá</th>
            <th className="py-3 px-4 w-40 text-right whitespace-nowrap">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-500">
                Chưa có dòng chi phí nào.
              </td>
            </tr>
          ) : (
            pagedLines.map((line, idx) => {
              const rowSTT = (currentPage - 1) * pageSize + idx + 1;
              return (
                <tr key={line.id || rowSTT} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center text-slate-500 font-mono tabular-nums whitespace-nowrap">
                    {rowSTT}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 leading-snug">{line.description}</div>
                    {line.serviceName && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Thuộc gói: <span className="font-semibold text-slate-700">{line.serviceName}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {renderTypeBadge(line.lineType)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-slate-800 whitespace-nowrap">
                    {line.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 font-mono tabular-nums whitespace-nowrap">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
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
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/70 text-xs text-slate-600 gap-2">
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
              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
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
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === num
                      ? 'bg-[#0866ff] text-white shadow-xs'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
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
              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer"
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
