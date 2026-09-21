import React from 'react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: any;
}

export default function CustomerDetailModal({ isOpen, onClose, customerData }: CustomerDetailModalProps) {
  if (!isOpen || !customerData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-lg border border-outline-variant overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface">
          <h2 className="text-headline-md font-headline-md font-bold text-on-surface">Hồ sơ chi tiết Khách hàng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="flex flex-col md:flex-row gap-6 bg-surface-container-low p-5 rounded-xl border border-outline-variant items-start md:items-center">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-display-sm shrink-0 shadow-sm border-2 border-surface">
              {customerData.fullName.split(' ').pop()?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-headline-md font-bold text-on-surface">{customerData.fullName}</h3>
              </div>
              <div className="flex items-center gap-4 mt-2 text-body-md text-on-surface-variant flex-wrap">
                <div className="flex items-center gap-1.5 font-code-mono font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-secondary">phone_iphone</span>
                  {customerData.phone}
                </div>
                {customerData.email && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">mail</span>
                    {customerData.email}
                  </div>
                )}
                {customerData.address && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">location_on</span>
                    {customerData.address}
                  </div>
                )}
              </div>
            </div>
            {/* Quick Stats right */}
            <div className="flex flex-col gap-3 md:border-l border-outline-variant md:pl-6 w-full md:w-auto">
              <div>
                <span className="text-label-sm text-secondary">Tổng chi tiêu</span>
                <div className="text-title-lg font-bold text-primary font-code-mono">
                  {(customerData.stats?.totalSpent || 0).toLocaleString('vi-VN')} ₫
                </div>
              </div>
              <div>
                <span className="text-label-sm text-secondary">Số lượt dịch vụ</span>
                <div className="text-title-md font-semibold text-on-surface">
                  {customerData.stats?.totalVisits || 0} lượt
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-outline-variant"></div>

          {/* Vehicles List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">directions_car</span>
                Danh sách Xe ({(customerData.vehicles || []).length})
              </h4>
            </div>
            
            {customerData.vehicles && customerData.vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerData.vehicles.map((v: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-outline-variant bg-surface flex items-center gap-4 hover:border-primary-container transition-colors shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[24px]">directions_car</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-100 font-code-mono text-label-md font-bold text-slate-900 w-fit mb-1 shadow-2xs">
                        {v.licensePlate}
                      </span>
                      <span className="text-body-md font-medium text-on-surface">
                        {v.make} {v.model}
                      </span>
                      <span className="text-label-sm text-secondary">
                        Màu: {v.color || 'N/A'} | Kích cỡ: {{
                          SMALL: 'Nhỏ',
                          MEDIUM: 'Vừa',
                          LARGE: 'Lớn',
                          EXTRA_LARGE: 'Rất lớn',
                          TRUCK: 'Xe tải'
                        }[v.vehicleSize as string] || v.vehicleSize}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-surface-container-lowest border border-dashed border-outline text-center text-secondary text-body-md">
                Khách hàng này chưa có phương tiện nào trong hệ thống.
              </div>
            )}
          </div>

          <div className="h-px w-full bg-outline-variant"></div>

          {/* Service History Mock */}
          <div>
            <h4 className="text-title-md font-bold text-on-surface flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">history</span>
              Lịch sử Dịch vụ
            </h4>
            <div className="p-4 rounded-lg bg-surface-container-lowest border border-dashed border-outline text-center text-secondary text-body-md flex flex-col items-center">
              <span className="material-symbols-outlined text-[32px] opacity-40 mb-2">construction</span>
              Tính năng Lịch sử sửa chữa đang được hoàn thiện (UC-15/UC-17)...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
