'use client';

import React from 'react';
import { InvoiceDetailDto } from '@/store/slices/invoiceSlice';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoice: InvoiceDetailDto | null;
  detailLoading: boolean;
  downloadingPdfId: number | null;
  onDownloadPdf: (invoiceId: number, invoiceNumber: string) => void;
  onOpenPayModal: (invoice: InvoiceDetailDto) => void;
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  selectedInvoice,
  detailLoading,
  downloadingPdfId,
  onDownloadPdf,
  onOpenPayModal,
}: InvoiceDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs cw-modal-overlay"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col cw-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-container-highest flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">receipt</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">
                Chi tiết hóa đơn {selectedInvoice ? `#${selectedInvoice.invoiceNumber}` : ''}
              </h3>
              <p className="text-xs text-on-surface-variant">Trung tâm dịch vụ kỹ thuật Car Service Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedInvoice && (
              <button
                type="button"
                onClick={() => onDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                disabled={downloadingPdfId === selectedInvoice.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold rounded-lg border border-surface-container-highest transition-colors cursor-pointer"
                title="Tải file hóa đơn PDF chuẩn từ hệ thống"
              >
                {downloadingPdfId === selectedInvoice.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                )}
                <span>{downloadingPdfId === selectedInvoice.id ? 'Đang tạo PDF...' : 'Tải hóa đơn PDF'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 print:p-0">
          {detailLoading || !selectedInvoice ? (
            <div className="py-12 text-center text-on-surface-variant">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Đang tải chi tiết hóa đơn...
            </div>
          ) : (
            <>
              {/* Gara & Invoice Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-highest text-xs">
                <div>
                  <p className="text-[10px] text-outline uppercase font-semibold">Khách hàng</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{selectedInvoice.customer.fullName}</p>
                  <p className="text-on-surface-variant">SĐT: {selectedInvoice.customer.phone}</p>
                  <p className="text-on-surface-variant">Email: {selectedInvoice.customer.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase font-semibold">Thông tin xe & tiếp nhận</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5 font-mono">
                    Biển số: {selectedInvoice.vehicle.licensePlate}
                  </p>
                  <p className="text-on-surface-variant">
                    Dòng xe: {selectedInvoice.vehicle.make} {selectedInvoice.vehicle.model}
                  </p>
                  <p className="text-on-surface-variant">
                    Cố vấn tiếp nhận: {selectedInvoice.advisor.fullName}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                selectedInvoice.status === 'PAID'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[18px]">
                    {selectedInvoice.status === 'PAID' ? 'verified' : 'pending'}
                  </span>
                  <span className="font-semibold">
                    Trạng thái: {selectedInvoice.status === 'PAID' ? 'Đã thanh toán hoàn tất' : 'Chưa thanh toán'}
                  </span>
                </div>
                {selectedInvoice.issuedAt && (
                  <span className="font-mono text-[11px]">
                    Ngày lập: {new Date(selectedInvoice.issuedAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-surface-container-highest rounded-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-surface-container-highest font-semibold text-on-surface-variant uppercase text-[10px]">
                      <th className="py-2.5 px-3">Hạng mục chi tiết</th>
                      <th className="py-2.5 px-3 text-center w-[12%] whitespace-nowrap">SL</th>
                      <th className="py-2.5 px-3 text-right w-[22%] whitespace-nowrap">Đơn giá (đ)</th>
                      <th className="py-2.5 px-3 text-right w-[24%] whitespace-nowrap">Thành tiền (đ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-highest">
                    {selectedInvoice.lines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-on-surface-variant">
                          Không có hạng mục chi tiết
                        </td>
                      </tr>
                    ) : (
                      selectedInvoice.lines.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-on-surface block">
                              {item.description}
                            </span>
                            <span className="text-[10px] text-outline">
                              Loại: {item.lineType === 'PART' ? 'Phụ tùng' : item.lineType === 'LABOUR' ? 'Công thợ' : 'Dịch vụ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono text-on-surface">
                            {item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-highest space-y-1.5 text-xs text-on-surface">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tạm tính dịch vụ & linh kiện:</span>
                  <span className="font-mono font-medium">{selectedInvoice.subtotal.toLocaleString()} đ</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Chiết khấu ưu đãi:</span>
                    <span className="font-mono font-medium">-{selectedInvoice.discountAmount.toLocaleString()} đ</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Thuế GTGT (VAT 0%):</span>
                  <span className="font-mono font-medium">0 đ</span>
                </div>
                <div className="pt-2 border-t border-surface-container-highest flex justify-between items-center text-sm">
                  <span className="font-bold text-on-surface">Tổng tiền thanh toán:</span>
                  <span className="font-bold font-mono text-base text-primary">
                    {selectedInvoice.totalAmount.toLocaleString()} đ
                  </span>
                </div>
                {selectedInvoice.status !== 'PAID' && (
                  <div className="flex justify-between items-center text-xs text-error font-semibold pt-1">
                    <span>Số tiền còn lại cần thanh toán:</span>
                    <span className="font-mono">{selectedInvoice.amountDue.toLocaleString()} đ</span>
                  </div>
                )}
              </div>

              {/* Payments list if any */}
              {selectedInvoice.payments.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-on-surface">Lịch sử thanh toán đã ghi nhận:</p>
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-on-surface">
                          Hình thức: {p.paymentMethod === 'CASH' ? 'Tiền mặt' : p.paymentMethod === 'CARD' ? 'Thẻ POS' : 'Chuyển khoản SePay'}
                        </span>
                        {p.transactionRef && (
                          <p className="text-[10px] text-outline font-mono">Mã giao dịch: {p.transactionRef}</p>
                        )}
                      </div>
                      <span className="font-bold font-mono text-emerald-700">
                        +{p.amount.toLocaleString()} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-container-highest flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest sticky bottom-0">
          <div className="flex flex-wrap items-center gap-2">
            {selectedInvoice && selectedInvoice.status === 'PAID' ? (
              <>
                <button
                  type="button"
                  onClick={() => onDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  disabled={downloadingPdfId === selectedInvoice.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl shadow-xs hover:bg-primary-dark transition-colors cursor-pointer active:scale-95"
                >
                  {downloadingPdfId === selectedInvoice.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  )}
                  <span>Tải biên lai / In PDF</span>
                </button>
                <span className="text-xs text-emerald-700 font-semibold hidden sm:inline-flex items-center gap-1 ml-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Hóa đơn đã quyết toán 100%
                </span>
              </>
            ) : selectedInvoice ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayModal(selectedInvoice);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  Thanh toán online ngay ({selectedInvoice.amountDue.toLocaleString()} đ)
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  disabled={downloadingPdfId === selectedInvoice.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-surface-container-highest hover:bg-surface-container text-on-surface text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {downloadingPdfId === selectedInvoice.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  )}
                  <span>In / Xuất PDF</span>
                </button>
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
