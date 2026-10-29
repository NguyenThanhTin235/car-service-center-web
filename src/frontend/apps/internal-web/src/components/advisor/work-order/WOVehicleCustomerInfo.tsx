'use client';
import React, { useState } from 'react';

type Props = {
  isReadOnly?: boolean;
  vehicle: {
    vin: string;
    color: string;
    class: string;
    classDesc: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    memberType: string;
    memberId: string;
    packageDesc: string;
  };
  workOrderInfo?: {
    type: string;
    advisor: string;
    planDate: string;
  };
};

export default function WOVehicleCustomerInfo({ isReadOnly = false, vehicle, customer, workOrderInfo }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Thông tin Xe & Khách hàng</h3>
        {!isReadOnly && (
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors"
            title="Chỉnh sửa thông tin"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-12">
        {/* Vehicle Column */}
        <div>
          <h4 className="flex items-center gap-2 text-label-md font-bold text-primary mb-3">
            <span className="material-symbols-outlined text-[18px]">directions_car</span>
            XE & BIỂN SỐ
          </h4>
          <div className="grid grid-cols-[100px_1fr] gap-y-3 text-body-md">
            <div className="text-on-surface-variant">VIN / Khung</div>
            <div className="text-on-surface font-mono text-[13px]">{vehicle.vin}</div>
            
            <div className="text-on-surface-variant">Màu sắc</div>
            <div className="text-on-surface">{vehicle.color}</div>
            
            <div className="text-on-surface-variant">Phân loại</div>
            <div className="text-on-surface">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded text-label-sm font-bold uppercase mr-2">{vehicle.class}</span>
              {vehicle.classDesc}
            </div>
            
            <div></div>
            <div className="text-body-sm text-outline mt-1 italic">
              Áp dụng chu kỳ bảo dưỡng xe thương mại & bảo hiểm hạng PHV.
            </div>
          </div>
        </div>

        {/* Customer Column */}
        <div>
          <h4 className="flex items-center gap-2 text-label-md font-bold text-primary mb-3">
            <span className="material-symbols-outlined text-[18px]">person</span>
            KHÁCH HÀNG
          </h4>
          <div className="grid grid-cols-[100px_1fr] gap-y-3 text-body-md">
            <div className="text-on-surface-variant">Khách hàng</div>
            <div className="text-primary font-semibold hover:underline cursor-pointer">{customer.name}</div>
            
            <div className="text-on-surface-variant">Số ĐT</div>
            <div className="text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">phone</span>
              {customer.phone}
            </div>
            
            <div className="text-on-surface-variant">Email</div>
            <div className="text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
              {customer.email}
            </div>
            
            <div className="text-on-surface-variant">Hạng thẻ</div>
            <div className="text-on-surface flex items-center gap-2">
              <span className="bg-[#FFB955] text-[#291800] px-2 py-0.5 rounded text-label-sm font-bold uppercase">{customer.memberType}</span>
              <span className="text-outline">{customer.memberId}</span>
            </div>
            
            <div className="text-on-surface-variant">Gói dịch vụ</div>
            <div className="text-secondary font-semibold hover:underline cursor-pointer">{customer.packageDesc}</div>
          </div>
        </div>
      </div>

      {workOrderInfo && (
        <div className="mt-8 border-t border-outline-variant/60 pt-8">
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">THÔNG TIN PHIẾU DỊCH VỤ</h3>
          <div className="grid grid-cols-2 gap-12">
            <div className="grid grid-cols-[100px_1fr] gap-y-3 text-body-md">
              <div className="text-on-surface-variant">Loại phiếu</div>
              <div className="text-on-surface">{workOrderInfo.type}</div>
              
              <div className="text-on-surface-variant">Cố vấn</div>
              <div className="text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-bold text-label-sm">
                  {workOrderInfo.advisor.charAt(0).toUpperCase()}
                </span>
                {workOrderInfo.advisor}
              </div>
            </div>
            
            <div className="grid grid-cols-[100px_1fr] gap-y-3 text-body-md items-start">
              <div className="text-on-surface-variant">Kế hoạch</div>
              <div className="text-on-surface">{workOrderInfo.planDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-4xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                Chỉnh sửa thông tin
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto styled-scrollbar">
              <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                
                {/* Thông tin Xe */}
                <div>
                  <h3 className="text-label-md font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                    <span className="material-symbols-outlined text-[18px]">directions_car</span> XE & BIỂN SỐ
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">VIN / Số khung</label>
                      <input type="text" defaultValue={vehicle.vin} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Màu sắc</label>
                      <input type="text" defaultValue={vehicle.color} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Phân loại</label>
                      <select defaultValue={vehicle.class} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                        <option value="LARGE">LARGE</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="SMALL">SMALL</option>
                        <option value="PHV">PHV (Private Hire)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Thông tin Khách hàng */}
                <div>
                  <h3 className="text-label-md font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                    <span className="material-symbols-outlined text-[18px]">person</span> KHÁCH HÀNG
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Họ và tên</label>
                      <input type="text" defaultValue={customer.name} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Số điện thoại</label>
                      <input type="tel" defaultValue={customer.phone} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Email</label>
                      <input type="email" defaultValue={customer.email} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Thông tin Phiếu dịch vụ */}
                {workOrderInfo && (
                  <div className="col-span-2">
                    <h3 className="text-label-md font-bold text-primary mb-4 flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span> THÔNG TIN PHIẾU DỊCH VỤ
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Loại phiếu (WO type)</label>
                          <input type="text" defaultValue={workOrderInfo.type} className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Cố vấn dịch vụ (Người tạo)</label>
                          <input 
                            type="text" 
                            defaultValue={workOrderInfo.advisor} 
                            disabled 
                            className="w-full px-3 py-2 bg-surface-container border border-outline-variant/50 rounded-lg text-body-md text-on-surface-variant outline-none cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Kế hoạch</label>
                          <div className="flex items-center gap-2">
                            <input type="date" defaultValue="2026-06-15" className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                            <span className="text-on-surface-variant material-symbols-outlined">arrow_right_alt</span>
                            <input type="date" defaultValue="2026-06-20" className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low mt-auto">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 rounded font-bold text-label-md bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-2.5 rounded font-bold text-label-md bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">save</span> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
