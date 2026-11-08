'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchItemMovements, InventoryItem } from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';

interface StockCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const MOVEMENT_TYPE_META: Record<
  string,
  { label: string; badgeClass: string; icon: string }
> = {
  OPENING: {
    label: 'Tồn đầu kỳ',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'inventory_2',
  },
  RECEIPT: {
    label: 'Nhập mua hàng',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'south_west',
  },
  ISSUE: {
    label: 'Xuất sửa chữa',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: 'north_east',
  },
  RETURN: {
    label: 'Hoàn trả kho',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: 'keyboard_return',
  },
  ADJUSTMENT: {
    label: 'Điều chỉnh / Đảo bút toán',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'tune',
  },
};

export function StockCardModal({ isOpen, onClose, item }: StockCardModalProps) {
  const dispatch = useAppDispatch();
  const { movements, movementsItem, movementsPagination, movementsLoading } = useAppSelector(
    (state) => state.inventory
  );
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIPT' | 'ISSUE' | 'OTHER'>('ALL');

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      setFilterType('ALL');
      dispatch(fetchItemMovements({ itemId: item.id, page: 1, limit: 15 }));
    }
  }, [isOpen, item, dispatch]);

  const handlePageChange = (newPage: number) => {
    if (!item) return;
    setPage(newPage);
    dispatch(fetchItemMovements({ itemId: item.id, page: newPage, limit: 15 }));
  };

  if (!item) return null;
  const displayItem = movementsItem || item;

  const totalReceiptQty = movements
    .filter((m) => m.movementType === 'RECEIPT' || m.movementType === 'OPENING')
    .reduce((sum, m) => sum + (m.quantity > 0 ? m.quantity : 0), 0);

  const totalIssueQty = movements
    .filter((m) => m.movementType === 'ISSUE')
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const filteredMovements = movements.filter((m) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'RECEIPT') return m.movementType === 'RECEIPT' || m.movementType === 'OPENING';
    if (filterType === 'ISSUE') return m.movementType === 'ISSUE';
    if (filterType === 'OTHER') return m.movementType !== 'RECEIPT' && m.movementType !== 'OPENING' && m.movementType !== 'ISSUE';
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thẻ Kho Phụ Tùng (Stock Card): [${displayItem.sku}]`}
      size="2xl"
    >
      <div className="space-y-4">
        {/* SKU Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-6 gap-3.5 text-xs">
          <div className="sm:col-span-2">
            <span className="text-slate-500 block">Tên phụ tùng & Thương hiệu</span>
            <div className="mt-1 font-bold text-slate-900 text-sm">
              {displayItem.partCategory?.name || displayItem.name}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              SKU: <strong className="text-[#0866ff]">{displayItem.sku}</strong> · Hãng:{' '}
              {displayItem.brand?.name || '—'} · ĐVT: {displayItem.uom?.name || 'Cái'}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">Tồn hiện tại</span>
            <div className="mt-1 font-mono font-extrabold text-lg text-slate-900">
              {displayItem.onHand}{' '}
              <span className="text-xs font-normal text-slate-500">
                {displayItem.uom?.name}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Định mức: <strong>{displayItem.reorderLevel}</strong>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">Tổng nhập / xuất</span>
            <div className="mt-1 font-mono font-bold text-xs space-y-0.5">
              <div className="text-emerald-700">+{totalReceiptQty} {displayItem.uom?.name}</div>
              <div className="text-rose-600">-{totalIssueQty} {displayItem.uom?.name}</div>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">Giá vốn bình quân</span>
            <div className="mt-1 font-mono font-bold text-sm text-[#0050cd]">
              {displayItem.averageCost.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[11px] text-slate-500">Phương pháp MWA</div>
          </div>

          <div>
            <span className="text-slate-500 block">Giá bán niêm yết</span>
            <div className="mt-1 font-mono font-bold text-sm text-emerald-700">
              {displayItem.sellingPrice.toLocaleString('vi-VN')} ₫
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-[#0866ff] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({movements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('RECEIPT')}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'RECEIPT'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhập mua hàng
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ISSUE')}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ISSUE'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xuất sửa chữa
            </button>
            <button
              type="button"
              onClick={() => setFilterType('OTHER')}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'OTHER'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khác
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Hiển thị <strong>{filteredMovements.length}</strong> / {movements.length} giao dịch
          </span>
        </div>

        {/* Movements Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600 whitespace-nowrap">
                <tr>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Loại giao dịch</th>
                  <th className="py-2.5 px-4">Chứng từ gốc</th>
                  <th className="py-2.5 px-4 text-right">SL Biến động</th>
                  <th className="py-2.5 px-4 text-right">Đơn giá vốn</th>
                  <th className="py-2.5 px-4 text-right">Tồn cuối</th>
                  <th className="py-2.5 px-4">Người thực hiện / Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {movementsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      Đang tải lịch sử biến động thẻ kho...
                    </td>
                  </tr>
                ) : filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Không có giao dịch nào phù hợp với bộ lọc đã chọn
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const meta = MOVEMENT_TYPE_META[m.movementType] || MOVEMENT_TYPE_META.RECEIPT;
                    const isPositive =
                      m.movementType === 'RECEIPT' ||
                      m.movementType === 'OPENING' ||
                      m.movementType === 'RETURN' ||
                      (m.movementType === 'ADJUSTMENT' && m.quantity > 0);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${meta.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {meta.icon}
                            </span>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                          <span className={m.movementType === 'ISSUE' ? 'text-amber-800' : 'text-[#0866ff]'}>
                            {m.referenceCode}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive && m.quantity > 0 ? `+${m.quantity}` : m.quantity} {displayItem.uom?.name || ''}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                          {Math.round(m.unitCost).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          {m.balanceAfter} {displayItem.uom?.name || ''}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {m.createdBy?.fullName || 'Hệ thống'}
                          </div>
                          {m.notes && (
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {m.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {movementsPagination && movementsPagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Tổng số <strong>{movementsPagination.totalRecords}</strong> bút toán thẻ kho
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: movementsPagination.totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold cursor-pointer ${
                        p === page
                          ? 'bg-[#0866ff] text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

