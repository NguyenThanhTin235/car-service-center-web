'use client';
import React from 'react';

export default function IntakeDetailModal({ record, onClose }: { record: any, onClose: () => void }) {
  if (!record) return null;

  const getTypeName = (type: string) => {
    switch (type) {
      case 'WALK_IN': return 'Khoang sửa chữa';
      case 'TOW_IN': return 'Khoang cẩu nâng';
      case 'APPOINTMENT': return 'Hẹn trước';
      default: return type;
    }
  };

  const getStatusName = (status: string) => {
    switch(status) {
      case 'QUEUED': return 'Chờ xử lý';
      case 'CONVERTED': return 'Đã chuyển lệnh (RO)';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  // Parse combined notes if they contain the formatted tags
  let vehicleCondition = record.vehicle_condition || '';
  let actualNotes = record.notes || '';

  if (actualNotes.includes('[Tình trạng xe]:') && actualNotes.includes('[Ghi chú]:')) {
    const vcMatch = actualNotes.match(/\[Tình trạng xe\]:\s*([\s\S]*?)(?=\n\n\[Ghi chú\]:|$)/);
    const nMatch = actualNotes.match(/\[Ghi chú\]:\s*([\s\S]*)/);
    
    if (vcMatch) vehicleCondition = vcMatch[1].trim();
    if (nMatch) actualNotes = nMatch[1].trim();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest">
          <h2 className="text-title-lg font-bold text-on-surface">Chi tiết phiếu tiếp nhận</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                <span className="text-label-md font-bold text-on-surface">Giờ đến: {new Date(record.arrived_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="w-px h-4 bg-outline-variant/50"></div>
              <span className="px-2 py-0.5 bg-primary-container text-on-primary-container rounded text-label-sm font-bold uppercase">{getTypeName(record.intake_type)}</span>
            </div>
            <div>
              <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-label-sm font-bold">
                Trạng thái: {getStatusName(record.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">person</span>
                Khách hàng
              </h3>
              <div className="flex flex-col gap-2 text-body-md text-on-surface">
                <p><span className="text-on-surface-variant inline-block w-20">Họ tên:</span> <span className="font-semibold">{record.customer?.full_name}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">SĐT:</span> <span className="font-semibold">{record.customer?.phone}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Email:</span> {record.customer?.email || '—'}</p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="flex flex-col gap-3">
              <h3 className="text-label-lg font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                Phương tiện
              </h3>
              <div className="flex flex-col gap-2 text-body-md text-on-surface">
                <p><span className="text-on-surface-variant inline-block w-20">Biển số:</span> <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{record.vehicle?.license_plate}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Xe:</span> <span className="font-semibold">{record.vehicle?.make} {record.vehicle?.model}</span></p>
                <p><span className="text-on-surface-variant inline-block w-20">Phân khúc:</span> {record.vehicle?.vehicle_size}</p>
                <p><span className="text-on-surface-variant inline-block w-20">Màu sắc:</span> {record.vehicle?.color || '—'}</p>
              </div>
            </div>
          </div>

          {/* Requested Services */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">build</span>
              Dịch vụ yêu cầu
            </h3>
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3">
              {record.services && record.services.length > 0 ? (
                <ul className="list-disc list-inside text-body-md text-on-surface flex flex-col gap-1">
                  {record.services.map((s: any) => (
                    <li key={s.id}>{s.service_template?.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-md text-outline italic">Không có dịch vụ cụ thể được yêu cầu</p>
              )}
            </div>
          </div>

          {/* Tow-in Info */}
          {record.intake_type === 'TOW_IN' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-label-lg font-bold text-warning flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Thông tin cứu hộ
              </h3>
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3">
                <p className="text-body-md text-on-surface"><span className="text-on-surface-variant mr-2">Đơn vị kéo:</span> <span className="font-bold">{record.tow_company || 'Không có thông tin'}</span></p>
              </div>
            </div>
          )}

          {/* Vehicle Condition */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">minor_crash</span>
              Mô tả tình trạng xe
            </h3>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 min-h-[60px] text-body-md text-on-surface">
              {vehicleCondition || <span className="text-outline italic">Không có mô tả tình trạng xe</span>}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-3">
            <h3 className="text-label-lg font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">note</span>
              Ghi chú
            </h3>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 min-h-[60px] text-body-md text-on-surface whitespace-pre-wrap">
              {actualNotes || <span className="text-outline italic">Không có ghi chú</span>}
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant/40 bg-surface-container-lowest">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-label-md hover:bg-primary/90 transition-colors shadow-sm">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
