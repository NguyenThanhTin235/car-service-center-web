'use client';
import React, { useState, useEffect, useRef } from 'react';
import { WorkOrder, saveCheckIn, confirmCheckIn, addServiceToWO, removeServiceFromWO, getServiceCatalog, ServiceTemplateOption } from '@/lib/api/work-order.api';
import toast from 'react-hot-toast';
import EvidenceUploader from './EvidenceUploader';
import VehicleInspectionPanel from './VehicleInspectionPanel';

interface TabCheckinProps {
  workOrder?: WorkOrder;
  refetchWO?: () => void;
  isReadOnly?: boolean;
}

export default function TabCheckinInspection({ workOrder, refetchWO, isReadOnly: propIsReadOnly = false }: TabCheckinProps) {
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [customerReported, setCustomerReported] = useState<string[]>([]);

  useEffect(() => {
    if (workOrder?.intake_record?.services) {
      const uniqueCategories = Array.from(
        new Set(workOrder.intake_record.services.map((s: any) => s.service?.category?.name).filter(Boolean))
      ) as string[];
      setJobTypes(uniqueCategories);
    }
    // You can parse specific tags from notes if needed, but for now we leave customerReported empty 
    // since the notes are displayed below in the UI anyway.
  }, [workOrder]);

  const toggleJobType = (type: string) => {
    setJobTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleCustomerReported = (type: string) => {
    if (!type.trim()) return;
    setCustomerReported(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const COMMON_COMPLAINTS = [
    'Đèn báo lỗi động cơ', 
    'Tiếng kêu lạ dưới gầm', 
    'Điều hòa không lạnh', 
    'Rò rỉ nhớt', 
    'Vô lăng rung lắc', 
    'Động cơ quá nhiệt',
    'Phanh không ăn',
    'Móp méo thân xe'
  ];
  const [isAddingComplaint, setIsAddingComplaint] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState('');
  const complaintDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (complaintDropdownRef.current && !complaintDropdownRef.current.contains(e.target as Node)) {
        setIsAddingComplaint(false);
        setComplaintSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add/Remove Service state
  const [isAdding, setIsAdding] = useState(false);
  const [catalog, setCatalog] = useState<ServiceTemplateOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingService, setSubmittingService] = useState(false);
  const [removingServiceId, setRemovingServiceId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load catalog when dropdown opens
  useEffect(() => {
    if (isAdding && catalog.length === 0) {
      loadCatalog();
    }
  }, [isAdding]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAdding(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const data = await getServiceCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh mục dịch vụ');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleAddService = async (templateId: number) => {
    if (!workOrder || submittingService) return;
    try {
      setSubmittingService(true);
      const res = await addServiceToWO(workOrder.id, templateId);
      if (res.success) {
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi thêm dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm dịch vụ');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleRemoveService = async (woServiceId: number) => {
    if (!workOrder || removingServiceId) return;
    try {
      setRemovingServiceId(woServiceId);
      const res = await removeServiceFromWO(workOrder.id, woServiceId);
      if (res.success) {
        if (refetchWO) refetchWO();
      } else {
        toast.error(res.message || 'Lỗi khi xóa dịch vụ');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa dịch vụ');
    } finally {
      setRemovingServiceId(null);
    }
  };

  const existingTemplateIds = workOrder?.services?.map((s) => s.service_id).filter((id): id is number => id !== null) || [];
  const filteredCatalog = catalog.filter((t) => !existingTemplateIds.includes(t.id) && t.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
      setExteriorCondition(ci.exterior_condition);
      setBelongings(ci.belongings || '');
      setEvidenceUrls(ci.evidence_urls || []);
      
      try {
        const parsed = JSON.parse(ci.complaint);
        if (parsed.tags) setCustomerReported(parsed.tags);
        if (parsed.notes) setComplaint(parsed.notes);
      } catch {
        setComplaint(ci.complaint);
      }
      
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
    const finalComplaint = JSON.stringify({
      tags: customerReported,
      notes: complaint.trim()
    });

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
  const isReadOnly = propIsReadOnly || !isEditing || isConfirmed;
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
        {/* Job Request / Type (Dynamic Services) */}
        <div>
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">YÊU CẦU / LOẠI CÔNG VIỆC</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {workOrder?.services?.map(svc => (
              <div key={svc.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-surface-container-high border-outline text-on-surface text-body-sm font-medium transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined text-[16px] text-primary">build</span>
                {svc.name}
                {!isReadOnly && (
                  <button
                    onClick={() => handleRemoveService(svc.id)}
                    disabled={removingServiceId === svc.id}
                    className="flex items-center justify-center text-on-surface-variant hover:text-error transition-colors disabled:opacity-50 ml-1"
                    title="Xóa dịch vụ"
                  >
                    <span className="material-symbols-outlined text-[16px]">{removingServiceId === svc.id ? 'progress_activity' : 'close'}</span>
                  </button>
                )}
              </div>
            ))}
            
            {!isReadOnly && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-primary text-primary text-body-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Thêm dịch vụ
                </button>

                {/* Dropdown Catalog */}
                {isAdding && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-50 overflow-hidden">
                    <div className="p-3 border-b border-outline-variant/40">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                        <input
                          type="text"
                          placeholder="Tìm dịch vụ..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-body-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto styled-scrollbar">
                      {loadingCatalog ? (
                        <div className="p-6 text-center text-on-surface-variant text-body-sm flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> Đang tải...
                        </div>
                      ) : filteredCatalog.length > 0 ? (
                        <ul className="py-1">
                          {filteredCatalog.map((template) => (
                            <li key={template.id}>
                              <button
                                onClick={() => handleAddService(template.id)}
                                disabled={submittingService}
                                className="w-full text-left px-4 py-3 hover:bg-surface-container-low focus:bg-surface-container-low outline-none transition-colors disabled:opacity-50"
                              >
                                <span className="font-medium text-body-sm text-on-surface block truncate">{template.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-6 text-center text-on-surface-variant text-body-sm">Không tìm thấy dịch vụ phù hợp</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {workOrder?.services?.length === 0 && isReadOnly && (
              <span className="text-body-sm text-outline italic">Không có dịch vụ nào được chọn</span>
            )}
          </div>
        </div>

        {/* Customer Reported (Dynamic Tags) */}
        <div>
          <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">KHÁCH HÀNG BÁO</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {customerReported.map(cr => (
              <div key={cr} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-surface-container-high border-outline text-on-surface text-body-sm font-medium transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined text-[16px] text-primary">chat</span>
                {cr}
                {!isReadOnly && (
                  <button
                    onClick={() => toggleCustomerReported(cr)}
                    className="flex items-center justify-center text-on-surface-variant hover:text-error transition-colors ml-1"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            ))}
            
            {!isReadOnly && (
              <div className="relative" ref={complaintDropdownRef}>
                <button
                  onClick={() => setIsAddingComplaint(!isAddingComplaint)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-primary text-primary text-body-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Thêm báo lỗi
                </button>

                {/* Dropdown Catalog */}
                {isAddingComplaint && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-50 overflow-hidden">
                    <div className="p-3 border-b border-outline-variant/40">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Gõ để tìm hoặc thêm mới..."
                          value={complaintSearch}
                          onChange={(e) => setComplaintSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && complaintSearch.trim()) {
                              toggleCustomerReported(complaintSearch.trim());
                              setComplaintSearch('');
                            }
                          }}
                          className="flex-1 px-3 py-2 text-body-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors"
                          autoFocus
                        />
                        <button 
                          onClick={() => {
                            if (complaintSearch.trim()) {
                              toggleCustomerReported(complaintSearch.trim());
                              setComplaintSearch('');
                            }
                          }}
                          className="bg-primary text-white px-3 py-2 rounded-lg text-label-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto styled-scrollbar">
                      {COMMON_COMPLAINTS.filter(c => !customerReported.includes(c) && c.toLowerCase().includes(complaintSearch.toLowerCase())).length > 0 ? (
                        <ul className="py-1">
                          {COMMON_COMPLAINTS.filter(c => !customerReported.includes(c) && c.toLowerCase().includes(complaintSearch.toLowerCase())).map((c) => (
                            <li key={c}>
                              <button
                                onClick={() => {
                                  toggleCustomerReported(c);
                                  setComplaintSearch('');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-surface-container-low focus:bg-surface-container-low outline-none transition-colors"
                              >
                                <span className="font-medium text-body-sm text-on-surface block truncate">{c}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-6 text-center text-on-surface-variant text-body-sm">
                          {complaintSearch ? 'Nhấn Thêm để tạo lỗi mới' : 'Tất cả lỗi phổ biến đã được thêm'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {customerReported.length === 0 && isReadOnly && (
              <span className="text-body-sm text-outline italic">Không có ghi nhận</span>
            )}
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
              <div className="col-span-2 flex flex-col gap-3 mb-4">
                {jobTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-body-sm text-on-surface-variant font-medium w-[120px]">Yêu cầu dịch vụ:</span>
                    {jobTypes.map(t => (
                      <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#856404] bg-[#FFF3CD] text-[#856404] text-label-sm font-medium">
                        <span className="material-symbols-outlined text-[14px]">check</span> {t}
                      </span>
                    ))}
                  </div>
                )}
                {customerReported.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-body-sm text-on-surface-variant font-medium w-[120px]">Khách hàng báo:</span>
                    {customerReported.map(t => (
                      <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant bg-surface text-on-surface-variant text-label-sm font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {jobTypes.length === 0 && customerReported.length === 0 && (
                  <span className="text-body-sm text-outline italic">Không có ghi nhận yêu cầu / báo lỗi.</span>
                )}
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

      {/* Vehicle Inspection Interactive Diagram (UC-33) */}
      {workOrder && (
        <VehicleInspectionPanel
          workOrder={workOrder}
          isReadOnly={propIsReadOnly || ['CLOSED', 'CANCELLED', 'RELEASED'].includes(workOrder?.status || '')}
        />
      )}

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
