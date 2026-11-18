'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  GoodsReceipt,
  postDraftReceipt,
  cancelReceipt,
} from '@/store/slices/inventorySlice';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';

interface GoodsReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: GoodsReceipt | null;
  onUpdated: () => void;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  POSTED: {
    label: 'Đã ghi sổ',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  DRAFT: {
    label: 'Bản nháp (Chờ kiểm đếm)',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CANCELLED: {
    label: 'Đã hủy chứng từ',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export function GoodsReceiptDetailModal({
  isOpen,
  onClose,
  receipt,
  onUpdated,
}: GoodsReceiptDetailModalProps) {
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.inventory);

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  if (!receipt) return null;

  const badge = STATUS_BADGE[receipt.status] || STATUS_BADGE.POSTED;

  const handlePostDraft = async () => {
    const res = await dispatch(postDraftReceipt(receipt.id));
    if (res.meta.requestStatus === 'fulfilled') {
      setToast({
        show: true,
        type: 'success',
        message: `Đã ghi sổ phiếu nhập ${receipt.receiptNumber} và cập nhật tồn kho!`,
      });
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 900);
    } else {
      setToast({
        show: true,
        type: 'error',
        message: (res.payload as string) || 'Không thể ghi sổ phiếu nhập',
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (cancelReason.trim().length < 3) {
      setToast({
        show: true,
        type: 'error',
        message: 'Vui lòng nhập lý do hủy phiếu nhập (tối thiểu 3 ký tự)',
      });
      return;
    }
    const res = await dispatch(
      cancelReceipt({ id: receipt.id, cancelReason: cancelReason.trim() })
    );
    if (res.meta.requestStatus === 'fulfilled') {
      setToast({
        show: true,
        type: 'success',
        message: `Đã hủy phiếu nhập ${receipt.receiptNumber} và hoàn tác tồn kho!`,
      });
      setShowCancelForm(false);
      setCancelReason('');
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 900);
    } else {
      setToast({
        show: true,
        type: 'error',
        message: (res.payload as string) || 'Lỗi khi hủy phiếu nhập kho',
      });
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=780');
    if (!printWindow) return;

    const rowsHtml = receipt.items
      .map(
        (line, idx) => `
        <tr>
          <td style="text-align:center">${idx + 1}</td>
          <td style="font-family:monospace;font-weight:700">${line.item?.sku || ''}</td>
          <td>${line.item?.partCategory?.name || line.item?.name || ''}${
          line.item?.brand ? ` (${line.item.brand.name})` : ''
        }</td>
          <td style="text-align:center">${line.item?.uom?.name || 'Cái'}</td>
          <td style="text-align:right;font-family:monospace">${line.quantity}</td>
          <td style="text-align:right;font-family:monospace">${line.unitCost.toLocaleString(
            'vi-VN'
          )} ₫</td>
          <td style="text-align:right;font-family:monospace">${line.discountRate || 0}%</td>
          <td style="text-align:right;font-family:monospace;font-weight:700">${(
            line.lineTotal || line.quantity * line.unitCost
          ).toLocaleString('vi-VN')} ₫</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Phiếu Nhập Kho - ${receipt.receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0866ff; padding-bottom: 16px; margin-bottom: 20px; }
          .title { text-align: center; margin: 16px 0 24px; }
          .title h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
          th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; }
          .totals { width: 320px; margin-left: auto; margin-bottom: 32px; }
          .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
          .totals .grand { font-size: 15px; font-weight: bold; color: #0866ff; border-top: 1px solid #94a3b8; padding-top: 8px; }
          .signatures { display: grid; grid-template-columns: repeat(4, 1fr); text-align: center; margin-top: 40px; }
          .signatures p { font-size: 11px; color: #64748b; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <strong style="font-size:15px;color:#0866ff">TRUNG TÂM DỊCH VỤ Ô TÔ CAR SERVICE CENTER</strong><br/>
            <span>Phân hệ Quản trị Kho & Vật tư Phụ tùng</span>
          </div>
          <div style="text-align:right">
            <strong>Số phiếu: ${receipt.receiptNumber}</strong><br/>
            <span>Trạng thái: ${badge.label}</span>
          </div>
        </div>
        <div class="title">
          <h1>PHIẾU NHẬP KHO PHỤ TÙNG</h1>
          <span>Ngày nhập: ${new Date(receipt.receivedDate).toLocaleDateString('vi-VN')}</span>
        </div>
        <div class="meta">
          <div><strong>Loại nghiệp vụ:</strong> ${
            receipt.receiptType === 'OPENING_STOCK' ? 'Nhập tồn đầu kỳ' : 'Nhập mua hàng từ NCC'
          }</div>
          <div><strong>Số hóa đơn / Chứng từ:</strong> ${receipt.referenceNo || '—'}</div>
          <div><strong>Nhà cung cấp:</strong> ${receipt.supplier?.name || '—'}</div>
          <div><strong>Mã số thuế NCC:</strong> ${receipt.supplier?.taxCode || '—'}</div>
          <div><strong>Người lập phiếu:</strong> ${receipt.createdBy?.fullName || 'Quản lý kho'}</div>
          <div><strong>Ghi chú:</strong> ${receipt.notes || '—'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã SKU</th>
              <th>Tên phụ tùng / Thương hiệu</th>
              <th>ĐVT</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>% CK</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="totals">
          <div><span>Tiền hàng trước thuế:</span><strong>${receipt.subtotal.toLocaleString(
            'vi-VN'
          )} ₫</strong></div>
          <div><span>Chiết khấu thương mại:</span><strong>-${receipt.discountAmount.toLocaleString(
            'vi-VN'
          )} ₫</strong></div>
          <div><span>Thuế GTGT (${receipt.taxRate}%):</span><strong>+${receipt.taxAmount.toLocaleString(
            'vi-VN'
          )} ₫</strong></div>
          <div class="grand"><span>Tổng cộng thanh toán:</span><span>${receipt.grandTotal.toLocaleString(
            'vi-VN'
          )} ₫</span></div>
        </div>
        <div class="signatures">
          <div><strong>Người lập phiếu</strong><p>(Ký, ghi rõ họ tên)</p></div>
          <div><strong>Người giao hàng</strong><p>(Ký, ghi rõ họ tên)</p></div>
          <div><strong>Thủ kho</strong><p>(Ký, ghi rõ họ tên)</p></div>
          <div><strong>Quản lý phê duyệt</strong><p>(Ký, đóng dấu)</p></div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi Tiết Chứng Từ Nhập Kho: ${receipt.receiptNumber}`}
        size="2xl"
      >
        <div className="space-y-5">
          {/* Header Metadata Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Mã phiếu & Trạng thái</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-[#0866ff]">
                  {receipt.receiptNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block">Nhà cung cấp</span>
              <div className="mt-1 font-bold text-slate-900">
                {receipt.supplier ? receipt.supplier.name : '— Nhập tồn đầu kỳ —'}
              </div>
              {receipt.supplier?.taxCode && (
                <div className="text-[11px] text-slate-500 font-mono">
                  MST: {receipt.supplier.taxCode} · SĐT: {receipt.supplier.phone}
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-500 block">Số hóa đơn VAT / Ngày nhập</span>
              <div className="mt-1 font-mono font-bold text-slate-900">
                {receipt.referenceNo || 'Chưa cập nhật số HĐ'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Ngày nhập: {new Date(receipt.receivedDate).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block">Người lập & Thời gian tạo</span>
              <div className="mt-1 font-semibold text-slate-900">
                {receipt.createdBy?.fullName || 'Quản lý dịch vụ'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {new Date(receipt.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            {receipt.notes && (
              <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-200/60 text-slate-700">
                <span className="font-bold text-slate-600 mr-1.5">Ghi chú:</span>
                {receipt.notes}
              </div>
            )}

            {receipt.status === 'CANCELLED' && receipt.cancelReason && (
              <div className="sm:col-span-2 lg:col-span-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                <strong>Lý do hủy phiếu:</strong> {receipt.cancelReason}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Mã SKU</th>
                    <th className="py-2.5 px-4">Phụ tùng / Thương hiệu</th>
                    <th className="py-2.5 px-4 text-center">ĐVT</th>
                    <th className="py-2.5 px-4 text-right">SL Nhập</th>
                    <th className="py-2.5 px-4 text-right">Đơn giá mua</th>
                    <th className="py-2.5 px-4 text-right">% CK</th>
                    <th className="py-2.5 px-4">Biến động Giá vốn TB (MWA)</th>
                    <th className="py-2.5 px-4 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {receipt.items.map((line, idx) => (
                    <tr key={line.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0866ff]">
                        {line.item?.sku}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {line.item?.partCategory?.name || line.item?.name}
                        </div>
                        {line.item?.brand && (
                          <span className="text-[11px] text-slate-500">
                            Hãng: {line.item.brand.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {line.item?.uom?.name || 'Cái'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        +{line.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {line.unitCost.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {line.discountRate || 0}%
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {line.oldAverageCost !== null &&
                        line.oldAverageCost !== undefined &&
                        line.newAverageCost !== null &&
                        line.newAverageCost !== undefined ? (
                          <div>
                            <span className="text-slate-500">
                              {Math.round(line.oldAverageCost).toLocaleString('vi-VN')} ₫
                            </span>{' '}
                            →{' '}
                            <strong className="text-[#0050cd]">
                              {Math.round(line.newAverageCost).toLocaleString('vi-VN')} ₫
                            </strong>
                            {line.oldOnHand !== null && line.oldOnHand !== undefined && (
                              <div className="text-slate-400">
                                Tồn: {line.oldOnHand} → {line.oldOnHand + line.quantity}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {(line.lineTotal || line.quantity * line.unitCost).toLocaleString(
                          'vi-VN'
                        )}{' '}
                        ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Footer */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-end gap-6 text-xs">
              <div>
                <span className="text-slate-500 block">Tiền hàng trước thuế</span>
                <span className="font-mono font-bold text-slate-800">
                  {receipt.subtotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Chiết khấu</span>
                <span className="font-mono font-bold text-emerald-700">
                  -{receipt.discountAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Thuế VAT ({receipt.taxRate}%)</span>
                <span className="font-mono font-bold text-slate-800">
                  +{receipt.taxAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-slate-500 block font-semibold">Tổng cộng phiếu nhập</span>
                <span className="text-lg font-mono font-extrabold text-[#0866ff]">
                  {receipt.grandTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Cancel Form if toggled */}
          {showCancelForm && (
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Xác nhận hủy phiếu nhập kho {receipt.receiptNumber} (Hệ thống sẽ trừ ngược số lượng
                tồn kho và khôi phục Giá vốn bình quân)
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy chứng từ bắt buộc (VD: Nhập sai đơn giá hóa đơn VAT, NCC giao nhầm mã...)"
                  className="flex-1 h-9 px-3 text-xs rounded-xl border border-rose-300 bg-white focus:border-rose-500 outline-none"
                />
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmCancel}
                  className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  {actionLoading ? 'Đang hủy...' : 'Xác nhận Hủy phiếu'}
                </button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>In Phiếu Nhập Kho (PDF)</span>
            </button>

            <div className="flex items-center gap-2.5">
              {receipt.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => setShowCancelForm(!showCancelForm)}
                  className="h-10 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>{showCancelForm ? 'Đóng khung hủy' : 'Hủy phiếu nhập'}</span>
                </button>
              )}

              {receipt.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handlePostDraft}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#0866ff] to-[#0050cd] hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#0866ff]/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{actionLoading ? 'Đang ghi sổ...' : 'Xác nhận Ghi sổ Nhập kho'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}

