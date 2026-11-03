import React from 'react';
import { InvoiceLine } from '@/lib/api/invoice.api';

interface Props {
  lines: InvoiceLine[];
}

export default function InvoiceLinesTable({ lines }: Props) {
  const formatMoney = (val: number) => (Number(val) || 0).toLocaleString('vi-VN') + ' đ';

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'LABOUR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            Công thợ
          </span>
        );
      case 'PART':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            Phụ tùng
          </span>
        );
      case 'MATERIAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
            Vật tư
          </span>
        );
      case 'PACKAGE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
            Gói trọn gói
          </span>
        );
      case 'FEE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            Phí dịch vụ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container-low text-on-surface-variant font-semibold text-xs uppercase tracking-wider border-b border-outline-variant">
          <tr>
            <th className="py-3 px-4 w-12 text-center">STT</th>
            <th className="py-3 px-4">Nội dung hạng mục</th>
            <th className="py-3 px-4 w-28 text-center">Phân loại</th>
            <th className="py-3 px-4 w-20 text-center">Số lượng</th>
            <th className="py-3 px-4 w-32 text-right">Đơn giá</th>
            <th className="py-3 px-4 w-36 text-right">Thành tiền</th>
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
            lines.map((line, idx) => (
              <tr key={line.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="py-3 px-4 text-center text-on-surface-variant">{idx + 1}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-on-surface">{line.description}</div>
                  {(line.serviceName || line.quotationNumber) && (
                    <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                      {line.serviceName && <span>Thuộc: {line.serviceName}</span>}
                      {line.quotationNumber && (
                        <span className="text-primary font-mono text-[11px] bg-primary/10 px-1.5 py-0.2 rounded">
                          {line.quotationNumber}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">{renderTypeBadge(line.lineType)}</td>
                <td className="py-3 px-4 text-center font-medium text-on-surface">{line.quantity}</td>
                <td className="py-3 px-4 text-right text-on-surface-variant">{formatMoney(line.unitPrice)}</td>
                <td className="py-3 px-4 text-right font-semibold text-on-surface">{formatMoney(line.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

