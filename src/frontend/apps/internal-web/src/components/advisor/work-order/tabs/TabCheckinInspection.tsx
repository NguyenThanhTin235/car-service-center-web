'use client';
import React, { useState } from 'react';

export default function TabCheckinInspection({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const [jobTypes, setJobTypes] = useState<string[]>(['Bảo dưỡng', 'Sửa chữa Gầm/Điện', 'Đồng sơn', 'Bảo hiểm']);
  const [customerReported, setCustomerReported] = useState<string[]>(['Đèn báo lỗi', 'Móp méo thân xe (sau)']);

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleCustomerReported = (type: string) => {
    setCustomerReported(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Intro Box */}
      <div className="bg-[#FAF5F0] border border-[#E6D5C3] text-[#5C4326] p-4 rounded-lg flex items-start gap-3 shadow-sm">
        <span className="bg-[#7C5000] text-white text-label-sm font-bold px-1.5 py-0.5 rounded">SO</span>
        <p className="text-body-sm leading-relaxed">
          Phiếu yêu cầu Dịch vụ là <strong>hợp đồng tiếp nhận</strong> giữa Xưởng và khách hàng. Phiếu này ghi lại yêu cầu công việc, tình trạng xe lúc bàn giao, sự đồng ý của khách hàng và quyền bắt đầu sửa chữa. Nút <strong>In Biên bản Tiếp nhận</strong> sẽ tạo ra bản in có chữ ký với đầy đủ điều khoản & điều kiện.
        </p>
      </div>

      {/* Pill Selectors */}
      <div className="grid grid-cols-2 gap-12">
        {/* Job Request / Type */}
        <div>
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">YÊU CẦU / LOẠI CÔNG VIỆC</h3>
          <div className="flex flex-wrap gap-2">
            {['Bảo dưỡng', 'Sửa chữa Gầm/Điện', 'Đồng sơn', 'Bảo hiểm', 'Chăm sóc xe', 'Khác'].map(type => {
              const isSelected = jobTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleJobType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-body-sm font-medium transition-colors ${isSelected ? 'bg-surface-container-high border-outline text-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                  {type}
                </button>
              );
            })}
          </div>
          <p className="text-body-sm text-on-surface-variant mt-3 italic">
            Các loại công việc được chọn sẽ mở các gói Dịch vụ tương ứng — xem tab Dịch vụ &rarr;
          </p>
        </div>

        {/* Customer Reported */}
        <div>
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">KHÁCH HÀNG BÁO</h3>
          <div className="flex flex-wrap gap-2">
            {['Đèn báo lỗi', 'Móp méo thân xe (sau)', 'Tiếng kêu lạ', 'Điều hòa', 'Rò rỉ nhớt'].map(type => {
              const isSelected = customerReported.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleCustomerReported(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-body-sm font-medium transition-colors ${isSelected ? 'bg-surface-container-high border-outline text-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaint / Remarks */}
      <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
        <span className="text-body-md text-on-surface-variant">Phàn nàn / ghi chú</span>
        <span className="text-body-md font-medium text-on-surface">Camera lùi không hoạt động sau va chạm phía sau.</span>
      </div>

      {/* Vehicle Condition At Check-in */}
      <div className="border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">TÌNH TRẠNG XE LÚC TIẾP NHẬN</h3>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high border border-outline rounded-full text-body-sm font-medium text-on-surface">
              <span className="material-symbols-outlined text-[16px]">check</span> Cẩu kéo (Tow-in)
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest border border-outline-variant rounded-full text-body-sm font-medium text-on-surface-variant">
              Xe điện
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
              <span className="text-body-sm text-on-surface-variant">Số km</span>
              <span className="text-body-sm font-medium">48,210 km</span>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
              <span className="text-body-sm text-on-surface-variant">Nhiên liệu / Pin</span>
              <div className="flex flex-col gap-1">
                <div className="relative w-full h-6 bg-surface-container-high rounded border border-outline-variant/50 flex overflow-hidden">
                  {/* Ticks */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 z-10 text-[10px] text-on-surface-variant">
                    <span>E</span><span>25</span><span>50</span><span>75</span><span>F</span>
                  </div>
                  {/* Fill Bar */}
                  <div className="h-full bg-gradient-to-r from-error-container via-[#FFDDB4] to-primary-container" style={{ width: '90%' }}></div>
                  {/* Selector Line */}
                  <div className="absolute top-0 bottom-0 w-1 bg-[#2C2C2C] shadow-sm" style={{ left: '90%' }}></div>
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant">Đầy (Full)</span>
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <span className="text-body-sm text-on-surface-variant">Tài sản đi kèm</span>
              <span className="text-body-sm font-medium">Thẻ thu phí, thẻ gửi xe tháng</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <span className="text-body-sm text-on-surface-variant">Ghi chú</span>
              <span className="text-body-sm font-medium">Khách hàng yêu cầu gọi điện trước khi phát sinh chi phí.</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
              <span className="text-body-sm text-on-surface-variant">Dự kiến chi phí</span>
              <span className="text-body-sm font-medium">S$ 1,920.00</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
              <span className="text-body-sm text-on-surface-variant">Dự kiến hoàn thành</span>
              <span className="text-body-sm font-medium">20 Thg 6 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Inspection Map Placeholder */}
      <div>
        <h3 className="text-body-md font-bold text-primary mb-1">Kiểm tra xe <span className="text-on-surface-variant font-normal text-body-sm">— tình trạng ghi nhận lúc tiếp nhận</span></h3>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Chọn loại tổn thất, sau đó <strong>nhấp vào vị trí trên xe</strong> để thêm ghi nhận — một dòng mới sẽ hiện ra với loại và vị trí được tự động điền. Ghi chú thêm ở dòng đó. Nhấp vào điểm đã đánh dấu (hoặc nút X ở dòng) để xóa.
        </p>
        <div className="w-full h-80 bg-surface-container-lowest border-2 border-dashed border-outline-variant/60 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">directions_car</span>
            <p className="text-body-md text-on-surface-variant font-medium">Bản đồ đánh dấu xe 2D (Đang phát triển)</p>
          </div>
        </div>
      </div>

      {/* Customer Sign-off */}
      <div>
        <h3 className="text-body-md font-bold text-primary mb-1">Khách hàng ký xác nhận <span className="text-on-surface-variant font-normal text-body-sm">— cố vấn chuẩn bị, khách hàng thực hiện</span></h3>
        
        <div className="bg-[#FAF5F0] border border-[#E6D5C3] text-[#5C4326] p-4 rounded-lg flex items-start gap-3 shadow-sm mb-6 mt-4">
          <span className="bg-[#5C4326] text-white text-label-sm font-bold px-1.5 py-0.5 rounded">SIGN</span>
          <p className="text-body-sm leading-relaxed">
            Cố vấn dịch vụ điền các thông tin tiếp nhận ở trên. <strong>Việc đồng ý và ký tên do chính khách hàng thực hiện</strong> — ký trực tiếp trên máy tính bảng hoặc gửi link về điện thoại của khách để ký từ xa (kéo xe / vắng mặt). Chữ ký được lưu với dấu vết kiểm toán, không phải trường dữ liệu cố vấn tự nhập.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 items-start border-t border-outline-variant/40 pt-6">
          {/* Left: Checkboxes */}
          <div>
            <h4 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">KHÁCH HÀNG ĐỒNG Ý VỚI</h4>
            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="text-body-sm text-on-surface">Xác nhận <strong>các đánh dấu về tình trạng xe</strong> (nếu có) lúc tiếp nhận.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="text-body-sm text-on-surface">Cho phép xưởng tiến hành các công việc trên chiếc xe được mô tả ở trên.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="text-body-sm text-on-surface">Đọc và chấp nhận <strong>Điều khoản & Điều kiện (v3 - 2026)</strong> (bản đầy đủ).</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="text-body-sm text-on-surface">Đồng ý cho thu thập & sử dụng dữ liệu theo quy định về Bảo vệ dữ liệu cá nhân.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                <span className="text-body-sm text-on-surface">Đồng ý rằng chi phí dự kiến có thể thay đổi; Xưởng sẽ xin phép trước khi vượt quá.</span>
              </label>
            </div>
            
            <div className="bg-[#FEF7D9] border border-[#F0DF91] text-[#7A6615] p-3 rounded-lg text-body-sm">
              <strong>T&C là tài liệu liên kết có phiên bản (v3, 2026).</strong> Bản ghi có chữ ký sẽ bị khóa theo phiên bản được hiển thị cho khách hàng lúc ký xác nhận, vì vậy bản in luôn mang chính xác các điều khoản đã áp dụng.
            </div>
          </div>

          {/* Right: Sign-off control */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 border-b border-outline-variant/40 shrink-0">
              <div className="flex items-center gap-4">
                <span className="font-bold text-body-md text-on-surface">Ký xác nhận</span>
                {!isReadOnly && (
                  <div className="flex bg-surface-container-highest rounded text-body-sm overflow-hidden">
                    <button className="px-3 py-1 bg-[#62475E] text-white font-medium">Trực tiếp</button>
                    <button className="px-3 py-1 text-on-surface-variant font-medium hover:bg-surface-container-low">Link từ xa</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant font-bold">
                <div className="w-2 h-2 rounded-full bg-outline"></div> Nháp
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              {isReadOnly ? (
                <div className="flex flex-col items-center justify-center text-outline h-full py-4">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">edit_document</span>
                  <span className="text-body-md italic text-center">Chưa có chữ ký của khách hàng</span>
                </div>
              ) : (
                <>
                  <p className="text-body-sm text-on-surface-variant mb-6">
                    Khách hàng đang ở quầy lễ tân. Đưa họ máy tính bảng — họ sẽ xem phần tổng hợp, đánh dấu đồng ý và ký tên. Cố vấn chứng kiến nhưng không được ký thay họ.
                  </p>
                  
                  <button className="bg-[#62475E] hover:bg-[#4E394A] text-white px-4 py-2 rounded font-bold text-label-md flex items-center gap-2 transition-colors mb-6 shadow-sm w-fit">
                    <span className="material-symbols-outlined text-[18px]">draw</span> Đưa cho khách / mở màn hình ký
                  </button>
                  
                  <div className="flex items-center gap-2 text-outline text-body-sm mt-auto">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    <span>In bản thỏa thuận <span className="opacity-70">(Chỉ khả dụng sau khi khách ký)</span></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
