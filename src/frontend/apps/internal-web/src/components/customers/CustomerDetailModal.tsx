import React from 'react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: any;
}

export default function CustomerDetailModal({ isOpen, onClose, customerData }: CustomerDetailModalProps) {
  if (!isOpen || !customerData) return null;

  // Vietnamese last word initial e.g. "Nguyễn Văn An" -> "A"
  const getInitial = (name: string) => {
    if (!name) return 'K';
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1]?.[0]?.toUpperCase() || 'K';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header (Sticky top) */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0050cd] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Hồ sơ chi tiết Khách hàng</h2>
              <p className="text-xs text-slate-500">Mã định danh KH #{customerData.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 styled-scrollbar">
          {/* Main Info Hero Box */}
          <div className="flex flex-col md:flex-row gap-5 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-2xl border border-slate-200/80 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0050cd] to-[#0866ff] text-white font-extrabold flex items-center justify-center text-2xl shrink-0 shadow-md shadow-blue-500/20">
                {getInitial(customerData.fullName)}
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-extrabold text-slate-900">{customerData.fullName}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                    <span className="material-symbols-outlined text-[15px] text-[#0050cd]">phone_iphone</span>
                    <span>{customerData.phone}</span>
                  </div>
                  {customerData.email && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                      <span>{customerData.email}</span>
                    </div>
                  )}
                  {customerData.address && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                      <span>{customerData.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Financial Aggregates */}
            <div className="flex md:flex-col gap-4 md:gap-2.5 md:border-l md:border-slate-200/80 md:pl-6 w-full md:w-auto pt-3 md:pt-0 border-t border-slate-200/60 md:border-t-0">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Tổng chi tiêu</span>
                <div className="text-base font-extrabold text-[#0050cd] font-mono tabular-nums">
                  {(customerData.stats?.totalSpent || 0).toLocaleString('vi-VN')} ₫
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Lượt dịch vụ</span>
                <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                  {customerData.stats?.totalVisits || 0} lượt hoàn tất
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0050cd]">directions_car</span>
                <span>Phương tiện sở hữu ({(customerData.vehicles || []).length})</span>
              </h4>
            </div>
            
            {customerData.vehicles && customerData.vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customerData.vehicles.map((v: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3.5 hover:border-blue-300 transition-all shadow-2xs">
                    <div className="w-11 h-11 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <span className="material-symbols-outlined text-[22px]">directions_car</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="px-2 py-0.5 rounded-md border border-slate-300 bg-slate-100 font-mono text-xs font-extrabold text-slate-900 w-fit mb-1 tracking-wider">
                        {v.licensePlate}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {v.make} {v.model}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Màu: {v.color || 'N/A'} • Cỡ xe: {{
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
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                Khách hàng này chưa đăng ký phương tiện nào trong hệ thống.
              </div>
            )}
          </div>

          {/* Service History Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px] text-[#0050cd]">history</span>
              <span>Lịch sử Dịch vụ tại Xưởng</span>
            </h4>
            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[28px] text-slate-400">build_circle</span>
              <p className="font-medium text-slate-600">Hồ sơ lịch sử dịch vụ sửa chữa và bảo dưỡng</p>
              <span className="text-[11px] text-slate-500">Đồng bộ tự động từ các Phiếu công việc (Work Orders) của khách hàng.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            type="button"
            className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
}
