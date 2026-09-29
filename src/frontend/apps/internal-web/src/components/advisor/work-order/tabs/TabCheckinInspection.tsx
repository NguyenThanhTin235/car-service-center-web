'use client';
import React, { useState, useEffect } from 'react';
import { WorkOrder, saveCheckIn, confirmCheckIn } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import EvidenceUploader from './EvidenceUploader';

interface TabCheckinProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
}

export default function TabCheckinInspection({ workOrder, refetchWO }: TabCheckinProps) {
  // Dummy tags
  const [jobTypes, setJobTypes] = useState<string[]>(['Bảo dưỡng', 'Sửa chữa Gầm/Điện', 'Đồng sơn', 'Bảo hiểm']);
  const [customerReported, setCustomerReported] = useState<string[]>(['Đèn báo lỗi', 'Móp méo thân xe (sau)']);

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleCustomerReported = (type: string) => {
    setCustomerReported(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // Form state for Check-in
  const [mileage, setMileage] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState<'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL'>('EMPTY');
  const [complaint, setComplaint] = useState<string>('');
  const [exteriorCondition, setExteriorCondition] = useState<string>('');
  const [belongings, setBelongings] = useState<string>('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!workOrder?.check_in);

  // Initialize from workOrder if check_in exists
  useEffect(() => {
    if (workOrder?.check_in) {
      const ci = workOrder.check_in;
      setMileage(ci.mileage.toString());
      setFuelLevel(ci.fuel_level);
      setComplaint(ci.complaint);
      setExteriorCondition(ci.exterior_condition);
      setBelongings(ci.belongings || '');
      setEvidenceUrls(ci.evidence_urls || []);
      
      // If it's already confirmed or pending confirmation, show read-only view by default
      if (ci.status === 'CONFIRMED' || ci.status === 'PENDING_CONFIRMATION') {
        setIsEditing(false);
      }
    } else if (workOrder?.intake_record?.notes) {
      setComplaint(workOrder.intake_record.notes);
      setIsEditing(true);
    }
  }, [workOrder]);

  const fuelOptions = [
    { value: 'EMPTY', label: 'E', percentage: 0 },
    { value: 'QUARTER', label: '1/4', percentage: 25 },
    { value: 'HALF', label: '1/2', percentage: 50 },
    { value: 'THREE_QUARTER', label: '3/4', percentage: 75 },
    { value: 'FULL', label: 'F', percentage: 100 },
  ] as const;

  const handleSave = async () => {
    if (!workOrder) return;
    
    // Validation
    const mil = parseInt(mileage);
    if (isNaN(mil) || mil < 0) {
      toast.error('Vui lòng nhập số km hợp lệ');
      return;
    }
    const finalComplaint = complaint.trim() || 'Không có ghi nhận từ lễ tân';

    if (!exteriorCondition.trim()) {
      toast.error('Vui lòng ghi nhận tình trạng xe (ngoại thất)');
      return;
    }

    try {
      setIsSaving(true);
      const res = await saveCheckIn(workOrder.id, {
        mileage: mil,
        fuel_level: fuelLevel,
        complaint: finalComplaint,
        exterior_condition: exteriorCondition.trim(),
        belongings: belongings.trim() || null,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null
      });

      if (res.success) {
        toast.success('Lưu ghi nhận tình trạng xe thành công');
        setIsEditing(false);
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!workOrder) return;
    try {
      setIsConfirming(true);
      const res = await confirmCheckIn(workOrder.id);
      if (res.success) {
        toast.success('Khách hàng đã ký xác nhận thành công!');
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xác nhận');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận');
    } finally {
      setIsConfirming(false);
    }
  };

  const isConfirmed = workOrder?.check_in?.status === 'CONFIRMED';
  const isReadOnly = !isEditing || isConfirmed;
  const showRejectReason = workOrder?.check_in?.status === 'REJECTED' || workOrder?.check_in?.status === 'REVISION_REQUIRED';

  return (
    <div className="flex flex-col gap-8">
      {/* Intro Box */}
      <div className="bg-[#FAF5F0] border border-[#E6D5C3] text-[#5C4326] p-4 rounded-lg flex items-start gap-3 shadow-sm">
        <span className="bg-[#7C5000] text-white text-label-sm font-bold px-1.5 py-0.5 rounded">SO</span>
        <p className="text-body-sm leading-relaxed">
          Phiếu yêu cầu Dịch vụ là <strong>hợp đồng tiếp nhận</strong> giữa Xưởng và khách hàng. Ghi lại tình trạng xe, thông tin bàn giao để làm bằng chứng tránh tranh chấp.
        </p>
      </div>

      {showRejectReason && (
        <div className="bg-error-container border border-error text-on-error-container p-4 rounded-lg flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <div>
            <strong className="block text-label-md">Khách hàng từ chối / Yêu cầu sửa đổi</strong>
            <p className="text-body-sm">{workOrder.check_in?.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Pill Selectors */}
      {!isReadOnly && (
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
      )}

      {/* Vehicle Condition At Check-in */}
      <div className="border border-outline-variant/60 rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">TÌNH TRẠNG XE LÚC TIẾP NHẬN</h3>
          <div className="flex items-center gap-4">
            {workOrder?.check_in && !isConfirmed && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-primary hover:bg-primary/10 px-3 py-1 rounded-full text-label-sm font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Sửa
              </button>
            )}
            {workOrder?.check_in && (
              <span className={`px-2 py-1 text-label-sm font-bold rounded ${workOrder.check_in.status === 'CONFIRMED' ? 'bg-[#D4EDDA] text-[#155724]' : workOrder.check_in.status === 'PENDING_CONFIRMATION' ? 'bg-[#FFF3CD] text-[#856404]' : 'bg-[#F8D7DA] text-[#721C24]'}`}>
                {workOrder.check_in.status === 'CONFIRMED' ? 'Đã ký xác nhận' : workOrder.check_in.status === 'PENDING_CONFIRMATION' ? 'Chờ KH xác nhận' : 'KH từ chối'}
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          {isReadOnly ? (
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="col-span-2 flex gap-2 mb-2">
                {jobTypes.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#856404] bg-[#FFF3CD] text-[#856404] text-label-sm font-medium">
                    <span className="material-symbols-outlined text-[14px]">check</span> {t}
                  </span>
                ))}
                {customerReported.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant bg-surface text-on-surface-variant text-label-sm font-medium">
                    {t}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-body-sm text-on-surface-variant">Mileage</span>
                  <span className="text-body-sm font-medium">{mileage ? `${parseInt(mileage).toLocaleString()} km` : ''}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-body-sm text-on-surface-variant">Belongings</span>
                  <span className="text-body-sm font-medium">{belongings || 'Không có'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-body-sm text-on-surface-variant">Est. job cost</span>
                  <span className="text-body-sm font-medium">S$ 1,920.00</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-body-sm text-on-surface-variant">Fuel / charge</span>
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-6 bg-gradient-to-r from-[#F6D2CA] via-[#F3E7B7] to-[#D5E9D4] rounded-md overflow-hidden flex relative shadow-sm border border-black/5">
                      <div className="flex-1 border-r border-black/5 flex items-center justify-center text-[10px] text-[#557088] z-10">E</div>
                      <div className="flex-1 border-r border-black/5 flex items-center justify-center text-[10px] text-[#557088] z-10">25</div>
                      <div className="flex-1 border-r border-black/5 flex items-center justify-center text-[10px] text-[#557088] z-10">50</div>
                      <div className="flex-1 border-r border-black/5 flex items-center justify-center text-[10px] text-[#557088] z-10">75</div>
                      <div className="flex-1 flex items-center justify-center text-[10px] text-[#557088] z-10">F</div>
                      <div className="absolute top-[10%] h-[80%] w-1.5 rounded-full bg-[#5C4326] shadow-sm z-20" style={{ left: `calc(${fuelOptions.find(o => o.value === fuelLevel)?.percentage}% - 3px)` }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-body-sm text-on-surface-variant">Notes</span>
                  <span className="text-body-sm font-medium">{workOrder?.intake_record?.notes || complaint || 'Không có ghi chú.'}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-body-sm text-on-surface-variant">Est. ready</span>
                  <span className="text-body-sm font-medium">20 Jun 2026</span>
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-[120px_1fr] gap-4 items-start pt-4 border-t border-outline-variant/30">
                <span className="text-body-sm text-on-surface-variant">Ngoại thất</span>
                <span className="text-body-sm font-medium whitespace-pre-wrap">{exteriorCondition}</span>
              </div>
              
              {evidenceUrls.length > 0 && (
                <div className="col-span-2 grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-body-sm text-on-surface-variant">Hình ảnh</span>
                  <div className="flex gap-2 flex-wrap">
                    {evidenceUrls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt="Evidence" 
                        className="w-16 h-16 object-cover rounded border border-outline-variant cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setPreviewImage(url)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              {/* Phàn nàn / Yêu cầu (Từ Lễ tân) */}
              <div className="col-span-2">
                <label className="block text-body-sm text-on-surface-variant mb-1">
                  Phàn nàn / Yêu cầu của khách (Ghi nhận bởi Lễ tân/Staff)
                </label>
                <div className="w-full px-3 py-3 bg-surface-container-low border border-outline rounded-md text-body-md text-on-surface-variant italic">
                  {workOrder?.intake_record?.notes || complaint || 'Không có ghi chú từ bộ phận tiếp nhận.'}
                </div>
              </div>

              {/* Số KM */}
              <div>
                <label className="block text-body-sm text-on-surface-variant mb-1">Số ODO (km) hiện tại <span className="text-error">*</span></label>
                <input
                  type="number"
                  value={mileage}
                  onChange={e => setMileage(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="VD: 45000"
                />
              </div>
              
              {/* Mức Nhiên Liệu */}
              <div>
                <label className="block text-body-sm text-on-surface-variant mb-1">Mức nhiên liệu <span className="text-error">*</span></label>
                <div className="flex gap-2">
                  {fuelOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFuelLevel(opt.value)}
                      className={`flex-1 py-2 border rounded-md text-body-sm font-medium transition-colors ${fuelLevel === opt.value ? 'bg-primary text-white border-primary' : 'bg-surface border-outline text-on-surface-variant hover:bg-surface-container-low'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tài sản đi kèm */}
              <div className="col-span-2">
                <label className="block text-body-sm text-on-surface-variant mb-1">Tài sản đi kèm / Ghi chú khác</label>
                <input
                  type="text"
                  value={belongings}
                  onChange={e => setBelongings(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="VD: USB, Thẻ từ, Kính râm..."
                />
              </div>

              {/* Tình trạng ngoại thất */}
              <div className="col-span-2">
                <label className="block text-body-sm text-on-surface-variant mb-1">Tình trạng ngoại thất <span className="text-error">*</span></label>
                <textarea
                  value={exteriorCondition}
                  onChange={e => setExteriorCondition(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface border border-outline rounded-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ghi nhận các vết xước, móp méo hiển nhiên..."
                />
              </div>
              
              {/* Hình ảnh minh chứng */}
              <div className="col-span-2">
                <label className="block text-body-sm text-on-surface-variant mb-2">Hình ảnh minh chứng</label>
                <EvidenceUploader 
                  images={evidenceUrls} 
                  onChange={setEvidenceUrls} 
                  readOnly={false} 
                />
              </div>

              <div className="col-span-2 flex justify-end mt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-[#523B4E] text-white px-6 py-2 rounded-md font-bold text-label-md flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Lưu Thông Tin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Sign-off */}
      {workOrder?.check_in && (
        <div>
          <h3 className="text-body-md font-bold text-primary mb-1">Khách hàng ký xác nhận <span className="text-on-surface-variant font-normal text-body-sm">— cố vấn chuẩn bị, khách hàng thực hiện</span></h3>
          
          <div className="bg-[#FAF5F0] border border-[#E6D5C3] text-[#5C4326] p-4 rounded-lg flex items-start gap-3 shadow-sm mb-6 mt-4">
            <span className="bg-[#5C4326] text-white text-label-sm font-bold px-1.5 py-0.5 rounded">SIGN</span>
            <p className="text-body-sm leading-relaxed">
              Cố vấn dịch vụ điền các thông tin tiếp nhận ở trên. <strong>Việc đồng ý và ký tên do chính khách hàng thực hiện</strong> — ký trực tiếp trên máy tính bảng hoặc gửi link về điện thoại của khách để ký từ xa (kéo xe / vắng mặt).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 items-start border-t border-outline-variant/40 pt-6">
            <div>
              <h4 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">KHÁCH HÀNG ĐỒNG Ý VỚI</h4>
              <div className="flex flex-col gap-3 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked readOnly className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                  <span className="text-body-sm text-on-surface">Xác nhận <strong>các đánh dấu về tình trạng xe</strong> lúc tiếp nhận.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked readOnly className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary" />
                  <span className="text-body-sm text-on-surface">Đọc và chấp nhận <strong>Điều khoản & Điều kiện (v3 - 2026)</strong>.</span>
                </label>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 border-b border-outline-variant/40">
                <span className="font-bold text-body-md text-on-surface">Gửi xác nhận</span>
                <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant font-bold">
                  <div className={`w-2 h-2 rounded-full ${workOrder.check_in.status === 'CONFIRMED' ? 'bg-[#28A745]' : 'bg-outline'}`}></div> 
                  {workOrder.check_in.status === 'CONFIRMED' ? 'Đã ký' : 'Chưa ký'}
                </div>
              </div>
              <div className="p-6">
                <p className="text-body-sm text-on-surface-variant mb-6">
                  Khách hàng đang ở quầy lễ tân. Đưa họ máy tính bảng — họ sẽ xem phần tổng hợp, đánh dấu đồng ý và ký tên.
                </p>
                <button 
                  disabled={workOrder.check_in.status === 'CONFIRMED' || isConfirming}
                  className="bg-[#62475E] hover:bg-[#4E394A] text-white px-4 py-2 rounded font-bold text-label-md flex items-center gap-2 transition-colors mb-6 shadow-sm disabled:opacity-50"
                  onClick={handleConfirm}
                >
                  {isConfirming ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">draw</span>}
                  Mô phỏng Khách hàng Ký
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
