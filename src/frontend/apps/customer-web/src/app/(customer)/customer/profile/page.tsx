'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProfile, updateProfile, clearUpdateStatus } from '@/store/slices/profileSlice';
import {
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  Vehicle,
} from '@/store/slices/vehicleSlice';
import {
  fetchAppointments,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  Appointment,
} from '@/store/slices/appointmentSlice';
import Toast from '@/components/shared/Toast';
import ConfirmModal from '@/components/shared/ConfirmModal';

type TabKey = 'profile' | 'vehicles' | 'appointments' | 'history';

// Vehicle Form Types & Presets
interface VehicleFormData {
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL';
}

const VEHICLE_SIZES = [
  { value: 'SMALL', label: 'Nhỏ (< 4.2m - Hatchback, Sedan B)' },
  { value: 'MEDIUM', label: 'Trung bình (4.2–4.6m - Sedan C, Crossover B)' },
  { value: 'LARGE', label: 'Lớn (4.6–5m - Sedan D, SUV 5-7 chỗ)' },
  { value: 'XL', label: 'Cỡ lớn (> 5m - Full-size SUV, Bán tải)' },
];

const EMPTY_VEHICLE_FORM: VehicleFormData = {
  licensePlate: '',
  make: '',
  model: '',
  year: '',
  color: '',
  vehicleSize: 'MEDIUM',
};

// 6 Available Service Packages matching the 3-step UI mockup
const AVAILABLE_SERVICES = [
  {
    id: 1,
    title: 'Bảo dưỡng định kỳ theo số km',
    badge: 'Phổ biến',
    desc: 'Cấp 40.000 km: Bao gồm kiểm tra toàn diện 48 hạng mục tiêu chuẩn.',
    icon: 'verified',
  },
  {
    id: 2,
    title: 'Kiểm tra hệ thống phanh & láng đĩa phanh',
    badge: null,
    desc: 'Đo độ mòn má phanh, kiểm tra dầu phanh và loại bỏ tiếng rít cọ xát.',
    icon: 'car_repair',
  },
  {
    id: 3,
    title: 'Thay dầu máy & lọc dầu cao cấp',
    badge: null,
    desc: 'Dầu động cơ tổng hợp toàn phần nhập khẩu và lọc dầu chính hãng.',
    icon: 'oil_barrel',
  },
  {
    id: 4,
    title: 'Kiểm tra hệ thống điều hòa & nạp gas',
    badge: null,
    desc: 'Đo áp suất gas R134a/R1234yf, vệ sinh giàn lạnh bằng nội soi công nghệ cao.',
    icon: 'ac_unit',
  },
  {
    id: 5,
    title: 'Vệ sinh buồng đốt & kim phun điện tử',
    badge: null,
    desc: 'Khử muội carbon, tối ưu mức tiêu hao nhiên liệu và phục hồi công suất động cơ.',
    icon: 'cleaning_services',
  },
  {
    id: 6,
    title: 'Đảo lốp & cân bằng động bánh xe',
    badge: null,
    desc: 'Chống mòn vẹt lốp không đều và khử rung lắc vô lăng khi chạy tốc độ cao.',
    icon: 'tire_repair',
  },
];

// Mock service history records for UI demonstration
interface HistoryRecord {
  id: string;
  orderCode: string;
  completedDate: string;
  licensePlate: string;
  vehicleModel: string;
  odometer: string;
  serviceAdvisor: string;
  servicePackage: string;
  items: string[];
  totalCost: string;
  status: 'COMPLETED' | 'IN_PROGRESS';
  invoiceUrl?: string;
}

const mockHistoryData: HistoryRecord[] = [
  {
    id: '1',
    orderCode: 'WO-202610-0042',
    completedDate: '12/10/2026',
    licensePlate: '51G-678.24',
    vehicleModel: 'Hyundai Santa Fe 2.2D',
    odometer: '24.500 km',
    serviceAdvisor: 'Trần Quốc Bảo',
    servicePackage: 'Bảo dưỡng định kỳ Cấp 2 (20.000 - 30.000 km)',
    items: [
      'Thay dầu nhớt động cơ Castrol Magnatec 5W-30 (4.5L)',
      'Thay cốc lọc dầu nhớt & lọc gió động cơ',
      'Vệ sinh bugi đánh lửa, họng hút và bướm ga',
      'Bảo dưỡng phanh 4 bánh & đảo lốp',
      'Xịt rửa khoang máy & kiểm tra 24 hạng mục an toàn',
    ],
    totalCost: '2.450.000 ₫',
    status: 'COMPLETED',
  },
  {
    id: '2',
    orderCode: 'WO-202604-0018',
    completedDate: '05/04/2026',
    licensePlate: '92C-300.35',
    vehicleModel: 'Ford Everest Titanium 4x4',
    odometer: '15.200 km',
    serviceAdvisor: 'Nguyễn Minh Tuấn',
    servicePackage: 'Thay thế lốp & Cân chỉnh thước lái vi tính Hunter',
    items: [
      'Thay 02 lốp trước Michelin Primacy SUV 265/50R20',
      'Cân bằng động điện tử 4 bánh xe',
      'Căn chỉnh góc đặt bánh xe và độ chụm thước lái 3D',
      'Kiểm tra toàn bộ hệ thống rotuyn và cao su gầm',
    ],
    totalCost: '6.800.000 ₫',
    status: 'COMPLETED',
  },
  {
    id: '3',
    orderCode: 'WO-202511-0089',
    completedDate: '20/11/2025',
    licensePlate: '51G-678.24',
    vehicleModel: 'Hyundai Santa Fe 2.2D',
    odometer: '10.000 km',
    serviceAdvisor: 'Trần Quốc Bảo',
    servicePackage: 'Bảo dưỡng định kỳ Cấp 1 (10.000 km)',
    items: [
      'Thay dầu máy động cơ & chêm nước làm mát',
      'Vệ sinh lọc gió điều hòa và khử khuẩn cabin',
      'Siết lại ốc gầm và kiểm tra áp suất lốp',
    ],
    totalCost: '1.250.000 ₫',
    status: 'COMPLETED',
  },
];

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { data, loading, error, updateLoading, updateError, updateSuccess } = useAppSelector(
    (state) => state.profile
  );
  const { vehicles, actionLoading: vehicleActionLoading } = useAppSelector((state) => state.vehicles);
  const { appointments } = useAppSelector((state) => state.appointments);

  // Active Tab State
  const initialTab = (searchParams.get('tab') as TabKey) || 'profile';
  const [activeTab, setActiveTab] = useState<TabKey>(
    ['profile', 'vehicles', 'appointments', 'history'].includes(initialTab) ? initialTab : 'profile'
  );

  // Profile Form States
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Vehicle Management State in child panel
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState<'add' | 'edit'>('add');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormData>(EMPTY_VEHICLE_FORM);
  const [vehicleDeleteConfirm, setVehicleDeleteConfirm] = useState<Vehicle | null>(null);
  const [vehicleToast, setVehicleToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ----------------------------------------------------
  // LARGE CALENDAR STATE (MONTHLY GRID FOR CUSTOMER)
  // ----------------------------------------------------
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedAptDetail, setSelectedAptDetail] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ----------------------------------------------------
  // 3-STEP APPOINTMENT BOOKING MODAL STATE (EXACT UI)
  // ----------------------------------------------------
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [bookingVehicleId, setBookingVehicleId] = useState<number | null>(null);
  const [customPlateInput, setCustomPlateInput] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([1, 2]);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [bookingTime, setBookingTime] = useState<string>('08:00');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // History Tab Filter States
  const [historySearch, setHistorySearch] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [viewInvoiceItem, setViewInvoiceItem] = useState<HistoryRecord | null>(null);
  const [viewProgressItem, setViewProgressItem] = useState<HistoryRecord | null>(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Fetch appointments strictly for this customer once profile loads (default to customer 1 if staff account)
  useEffect(() => {
    const targetCustId = data?.id && data.id <= 30 ? data.id : 1;
    dispatch(fetchAppointments({ customer_id: targetCustId }));
  }, [data?.id, dispatch]);

  // Sync profile form when data loads
  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
    }
  }, [data]);

  // Set default vehicle for booking when vehicles load
  useEffect(() => {
    if (vehicles.length > 0 && bookingVehicleId === null) {
      setBookingVehicleId(vehicles[0].id);
    }
  }, [vehicles, bookingVehicleId]);

  // Auto-dismiss profile success message
  useEffect(() => {
    if (updateSuccess) {
      setIsEditing(false);
      const t = setTimeout(() => dispatch(clearUpdateStatus()), 3000);
      return () => clearTimeout(t);
    }
  }, [updateSuccess, dispatch]);

  const requestSave = () => {
    if (!form.fullName.trim()) return;
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    dispatch(updateProfile({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      address: form.address,
    }));
    setConfirmOpen(false);
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      });
    }
    setIsEditing(false);
    dispatch(clearUpdateStatus());
  };

  // Vehicle Management handlers
  const handleOpenAddVehicle = () => {
    setVehicleModalMode('add');
    setSelectedVehicle(null);
    setVehicleForm(EMPTY_VEHICLE_FORM);
    setVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setVehicleModalMode('edit');
    setSelectedVehicle(v);
    setVehicleForm({
      licensePlate: v.licensePlate,
      make: v.make,
      model: v.model,
      year: v.year?.toString() || '',
      color: v.color || '',
      vehicleSize: (v.vehicleSize as VehicleFormData['vehicleSize']) || 'MEDIUM',
    });
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.licensePlate.trim() || !vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      setVehicleToast({ message: 'Vui lòng điền các trường bắt buộc: Biển số, Hãng xe, Dòng xe', type: 'error' });
      return;
    }

    try {
      if (vehicleModalMode === 'add') {
        await dispatch(createVehicle({
          licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
          make: vehicleForm.make.trim(),
          model: vehicleForm.model.trim(),
          year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
          color: vehicleForm.color ? vehicleForm.color.trim() : undefined,
          vehicleSize: vehicleForm.vehicleSize,
        })).unwrap();
        setVehicleToast({ message: 'Thêm phương tiện mới thành công!', type: 'success' });
      } else if (selectedVehicle) {
        await dispatch(updateVehicle({
          id: selectedVehicle.id,
          dto: {
            make: vehicleForm.make.trim(),
            model: vehicleForm.model.trim(),
            year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
            color: vehicleForm.color ? vehicleForm.color.trim() : undefined,
            vehicleSize: vehicleForm.vehicleSize,
          },
        })).unwrap();
        setVehicleToast({ message: 'Cập nhật thông tin xe thành công!', type: 'success' });
      }
      setVehicleModalOpen(false);
      dispatch(fetchVehicles());
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Thao tác không thành công', type: 'error' });
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleDeleteConfirm) return;
    try {
      await dispatch(deleteVehicle(vehicleDeleteConfirm.id)).unwrap();
      setVehicleToast({ message: 'Đã xóa phương tiện thành công!', type: 'success' });
      setVehicleDeleteConfirm(null);
      dispatch(fetchVehicles());
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Không thể xóa phương tiện này', type: 'error' });
      setVehicleDeleteConfirm(null);
    }
  };

  // ----------------------------------------------------
  // LARGE CALENDAR LOGIC (Generated for Month View)
  // ----------------------------------------------------
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon = 0, Sun = 6

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const isCurrentMonth = d.getMonth() === month;
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      // Construct local YYYY-MM-DD string to avoid UTC timezone offset shift
      const cellYear = d.getFullYear();
      const cellMonth = String(d.getMonth() + 1).padStart(2, '0');
      const cellDate = String(d.getDate()).padStart(2, '0');
      const cellDateStr = `${cellYear}-${cellMonth}-${cellDate}`;

      const effectiveCustomerId = data?.id && data.id <= 30 ? data.id : 1;

      const dayApts = appointments.filter((a) => {
        // Only show appointments belonging to this customer (or preview customer 1 if staff account)
        if (a.customer_id && a.customer_id !== effectiveCustomerId) {
          return false;
        }
        const aDateStr =
          typeof a.scheduled_date === 'string'
            ? a.scheduled_date.substring(0, 10)
            : `${new Date(a.scheduled_date).getFullYear()}-${String(new Date(a.scheduled_date).getMonth() + 1).padStart(2, '0')}-${String(new Date(a.scheduled_date).getDate()).padStart(2, '0')}`;
        return aDateStr === cellDateStr;
      });

      return {
        date: d,
        dateNum: d.getDate(),
        dateStr: cellDateStr,
        isCurrentMonth,
        isToday,
        appointments: dayApts,
      };
    });
  }, [calendarDate, appointments, data?.id]);

  const handleOpen3StepBooking = (initialDate?: Date) => {
    setBookingDate(initialDate || new Date());
    setBookingNotes('');
    setBookingStep(1);
    setBookingModalOpen(true);
  };

  const handleToggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirm3StepBooking = async () => {
    if (!bookingVehicleId && !customPlateInput.trim()) {
      setVehicleToast({ message: 'Vui lòng chọn hoặc nhập thông tin xe.', type: 'error' });
      return;
    }
    if (selectedServiceIds.length === 0 && !bookingNotes.trim()) {
      setVehicleToast({ message: 'Vui lòng chọn ít nhất 1 dịch vụ hoặc mô tả tình trạng xe.', type: 'error' });
      return;
    }
    if (!bookingDate || !bookingTime) {
      setVehicleToast({ message: 'Vui lòng chọn ngày và giờ hẹn.', type: 'error' });
      return;
    }

    setBookingSubmitting(true);
    try {
      const formattedDate = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

      let chosenVehicleId = bookingVehicleId;
      // If user entered custom plate
      if (customPlateInput.trim()) {
        const plate = customPlateInput.trim().toUpperCase();
        const existing = vehicles.find((v) => v.licensePlate.toUpperCase() === plate);
        if (existing) {
          chosenVehicleId = existing.id;
        } else {
          try {
            const newVehRes = await dispatch(
              createVehicle({
                licensePlate: plate,
                make: 'Khác',
                model: 'Khác',
                vehicleSize: 'MEDIUM',
              })
            ).unwrap();
            chosenVehicleId = newVehRes.id;
            dispatch(fetchVehicles());
          } catch {
            chosenVehicleId = vehicles[0]?.id;
          }
        }
      } else if (!chosenVehicleId || chosenVehicleId >= 990 || chosenVehicleId === 0) {
        // Fallback mock cards: Map to existing vehicle if present, or create in DB
        if (vehicles.length > 0) {
          chosenVehicleId = vehicles[0].id;
        } else {
          const fallbackPlate = chosenVehicleId === 999 ? '30H-888.99' : '29A-678.90';
          const fallbackMake = chosenVehicleId === 999 ? 'Mazda' : 'Ford';
          const fallbackModel = chosenVehicleId === 999 ? 'CX-5' : 'Ranger';
          try {
            const newVeh = await dispatch(
              createVehicle({
                licensePlate: fallbackPlate,
                make: fallbackMake,
                model: fallbackModel,
                vehicleSize: 'MEDIUM',
              })
            ).unwrap();
            chosenVehicleId = newVeh.id;
            dispatch(fetchVehicles());
          } catch {
            chosenVehicleId = vehicles[0]?.id || 1;
          }
        }
      }

      await dispatch(
        createAppointment({
          customer_id: data?.id,
          vehicle_id: chosenVehicleId || vehicles[0]?.id || 1,
          scheduled_date: formattedDate,
          scheduled_time: bookingTime,
          notes: bookingNotes,
          service_ids: selectedServiceIds,
        })
      ).unwrap();

      setVehicleToast({ message: 'Đặt lịch dịch vụ thành công! Hệ thống đã ghi nhận lịch hẹn.', type: 'success' });
      setBookingModalOpen(false);
      setBookingNotes('');
      dispatch(fetchAppointments({}));
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Không thể đặt lịch. Vui lòng thử lại.', type: 'error' });
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Appointment Action handlers
  const handleConfirmCancelApt = async () => {
    if (!cancelApt) return;
    try {
      await dispatch(cancelAppointment({ id: cancelApt.id, reason: cancelReason || 'Khách hàng bận' })).unwrap();
      setVehicleToast({ message: 'Đã hủy lịch hẹn thành công.', type: 'success' });
      setCancelApt(null);
      setSelectedAptDetail(null);
      dispatch(fetchAppointments({}));
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Lỗi khi hủy lịch', type: 'error' });
    }
  };

  const handleConfirmRescheduleApt = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) {
      setVehicleToast({ message: 'Vui lòng chọn đầy đủ ngày và giờ mới.', type: 'error' });
      return;
    }
    try {
      await dispatch(
        rescheduleAppointment({
          id: rescheduleApt.id,
          updateData: { scheduled_date: rescheduleDate, scheduled_time: rescheduleTime },
        })
      ).unwrap();
      setVehicleToast({ message: 'Dời lịch hẹn thành công!', type: 'success' });
      setRescheduleApt(null);
      setSelectedAptDetail(null);
      dispatch(fetchAppointments({}));
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Lỗi khi dời lịch', type: 'error' });
    }
  };

  // Get initials for Avatar (e.g. "Đinh Duẫn Phan" -> "ĐP")
  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const inputClass = (editable: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-150 ${
      editable
        ? 'border-blue-500 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
        : 'border-slate-200 bg-slate-50 text-slate-800 cursor-default'
    }`;

  // Filtered Service History records
  const filteredHistory = useMemo(() => {
    return mockHistoryData.filter((item: HistoryRecord) => {
      const matchVehicle =
        selectedVehicleFilter === 'ALL' || item.licensePlate === selectedVehicleFilter;
      const matchSearch =
        !historySearch.trim() ||
        item.orderCode.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.servicePackage.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.licensePlate.toLowerCase().includes(historySearch.toLowerCase());
      return matchVehicle && matchSearch;
    });
  }, [historySearch, selectedVehicleFilter]);

  // 4 Tabs in Vertical Sidebar
  const navTabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: 'account_circle' },
    { key: 'vehicles', label: 'Xe của tôi', icon: 'directions_car' },
    { key: 'appointments', label: 'Đặt lịch', icon: 'calendar_today' },
    { key: 'history', label: 'Lịch sử dịch vụ', icon: 'history' },
  ];

  // Selected vehicle for step 3 summary
  const selectedVehicleObj = vehicles.find((v) => v.id === bookingVehicleId) || vehicles[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-800 font-medium">
          {navTabs.find((t) => t.key === activeTab)?.label || 'Hồ sơ cá nhân'}
        </span>
      </nav>

      {/* Main Grid: Left Sidebar Tabs + Right Content */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        
        {/* Left Column: Sidebar Tabs */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
          {/* User Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {getInitials(data?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-800 truncate">
                {data?.fullName || 'Khách hàng'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thành viên Tiêu chuẩn
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xl transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Column: Tab Content */}
        <main className="flex-1 min-w-0 w-full">
          
          {/* TAB 1: HỒ SƠ CÁ NHÂN */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Hồ sơ cá nhân</h2>
                  <p className="text-xs text-slate-500 mt-1">Quản lý và cập nhật thông tin hồ sơ của bạn</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    readOnly={!isEditing}
                    className={inputClass(isEditing)}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">phone</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        readOnly={!isEditing}
                        className={`${inputClass(isEditing)} pl-10`}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        readOnly={!isEditing}
                        className={`${inputClass(isEditing)} pl-10`}
                        placeholder="Nhập email"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Địa chỉ liên hệ
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 material-symbols-outlined text-slate-400 text-[18px]">location_on</span>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      readOnly={!isEditing}
                      rows={2}
                      className={`${inputClass(isEditing)} pl-10 resize-none`}
                      placeholder="Nhập địa chỉ của bạn"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Thông tin tài khoản</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Ngày tham gia</p>
                      <p className="font-semibold text-slate-800">
                        {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Trạng thái</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${data?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {data?.isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={requestSave}
                      disabled={updateLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm"
                    >
                      {updateLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">save</span>
                      )}
                      {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updateLoading}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: XE CỦA TÔI */}
          {activeTab === 'vehicles' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Xe của tôi</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Quản lý danh sách phương tiện, thêm mới hoặc điều chỉnh thông số xe của bạn
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddVehicle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-center"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Thêm xe mới
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-3xl">directions_car</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Chưa có phương tiện nào</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Thêm xe ô tô của bạn vào hệ thống để dễ dàng đặt lịch bảo dưỡng và theo dõi lịch sử dịch vụ.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddVehicle}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    + Thêm xe ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {vehicles.map((v) => {
                    const sizeText = VEHICLE_SIZES.find((s) => s.value === v.vehicleSize)?.label?.split(' ')[0] || v.vehicleSize;
                    return (
                      <div
                        key={v.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg tracking-wider shadow-sm">
                              {v.licensePlate}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                v.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {v.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-slate-900 leading-snug">
                            {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                          </h3>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[11px] text-slate-400 block">Màu sắc:</span>
                              <strong className="text-slate-700 font-semibold">{v.color || 'Không rõ'}</strong>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400 block">Kích thước:</span>
                              <strong className="text-slate-700 font-semibold">{sizeText || 'Tiêu chuẩn'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(v)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl text-xs font-semibold transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setVehicleDeleteConfirm(v)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ĐẶT LỊCH (LỊCH LỚN + MODAL XEM CHI TIẾT RIÊNG CHO CUSTOMER) */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
              {/* Header Box with Month Navigation & Book Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Lịch hẹn dịch vụ</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Theo dõi lịch hẹn dịch vụ của bạn trên lịch lớn hoặc đặt hẹn mới
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Month Navigation */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(calendarDate);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarDate(prev);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-2 min-w-[120px] text-center">
                      Tháng {calendarDate.getMonth() + 1} / {calendarDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(calendarDate);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarDate(next);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>

                  {/* 3-Step Book Appointment Button */}
                  <button
                    type="button"
                    onClick={() => handleOpen3StepBooking(new Date())}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Đặt lịch mới
                  </button>
                </div>
              </div>

              {/* Large Monthly Calendar Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Weekday Header */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600">
                  <span>Thứ 2</span>
                  <span>Thứ 3</span>
                  <span>Thứ 4</span>
                  <span>Thứ 5</span>
                  <span>Thứ 6</span>
                  <span>Thứ 7</span>
                  <span className="text-red-500">Chủ nhật</span>
                </div>

                {/* 35 Calendar Cells */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
                  {calendarDays.map((cell, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (cell.appointments.length === 0) {
                          handleOpen3StepBooking(cell.date);
                        }
                      }}
                      className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/50 text-slate-300'
                          : cell.isToday
                          ? 'bg-blue-50/40'
                          : 'hover:bg-blue-50/20'
                      }`}
                    >
                      {/* Date Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            cell.isToday
                              ? 'bg-blue-600 text-white shadow-sm font-bold'
                              : cell.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dateNum}
                        </span>
                        {cell.isCurrentMonth && (
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-semibold transition-opacity">
                            + Đặt lịch
                          </span>
                        )}
                      </div>

                      {/* Appointments List on Date */}
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {cell.appointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAptDetail(apt);
                            }}
                            className={`p-1.5 rounded-lg text-[11px] font-medium transition-all shadow-xs flex items-center justify-between ${
                              apt.status === 'ARRIVED'
                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                : apt.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : apt.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 line-through'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            <span className="truncate">
                              {apt.scheduled_time_str || apt.scheduled_time} • {apt.vehicle?.license_plate || 'Xe'}
                            </span>
                            <span className="material-symbols-outlined text-[13px] shrink-0">info</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LỊCH SỬ DỊCH VỤ */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Lịch sử dịch vụ & Bảo dưỡng</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Tra cứu toàn bộ hồ sơ kỹ thuật, các lần vào xưởng và linh kiện đã thay thế
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                      <span className="block text-[11px] text-blue-600 font-medium">Tổng số lần vào xưởng</span>
                      <span className="text-lg font-bold text-blue-900">{mockHistoryData.length} lần</span>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="block text-[11px] text-emerald-600 font-medium">Lần gần nhất</span>
                      <span className="text-lg font-bold text-emerald-900">{mockHistoryData[0].completedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Tìm kiếm theo mã phiếu, hạng mục, biển số..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:w-56 shrink-0">
                    <select
                      value={selectedVehicleFilter}
                      onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="ALL">Tất cả phương tiện</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.licensePlate}>
                          {v.licensePlate} ({v.make} {v.model})
                        </option>
                      ))}
                      {vehicles.length === 0 && (
                        <>
                          <option value="51G-678.24">51G-678.24 (Hyundai Santa Fe)</option>
                          <option value="92C-300.35">92C-300.35 (Ford Everest)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Service History Timeline List */}
              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-slate-300">history_toggle_off</span>
                    <p className="text-sm text-slate-500 mt-2">Không tìm thấy lịch sử dịch vụ phù hợp.</p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-4"
                    >
                      {/* Top Row: Header & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">build_circle</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{item.orderCode}</span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Đã hoàn tất
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Ngày hoàn thành: {item.completedDate}</p>
                          </div>
                        </div>

                        {/* Vehicle & Odo */}
                        <div className="text-left sm:text-right">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800">
                            {item.licensePlate}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.vehicleModel} • ODO: <strong className="text-slate-700">{item.odometer}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Middle: Service Package & Performed Items */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                          {item.servicePackage}
                        </h4>
                        <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Chi tiết hạng mục & Phụ tùng:
                          </p>
                          <ul className="space-y-1.5">
                            {item.items.map((subItem, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                <span className="material-symbols-outlined text-emerald-500 text-[14px] mt-0.5 shrink-0">
                                  check_circle
                                </span>
                                <span>{subItem}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Bottom Row: Cost, Advisor & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>
                            Cố vấn: <strong className="text-slate-700">{item.serviceAdvisor}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Tổng thanh toán: <strong className="text-blue-700 text-sm">{item.totalCost}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewProgressItem(item)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">timeline</span>
                            Xem tiến độ
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewInvoiceItem(item)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            Xem hóa đơn
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================== */}
      {/* 3-STEP APPOINTMENT BOOKING MODAL (IDENTICAL TO PROVIDED UI MOCKUP) */}
      {/* ============================================================== */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header with Title & Stepper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Đặt lịch dịch vụ & sửa chữa</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Quy trình 3 bước đơn giản – Tiết kiệm thời gian, nhận xe đúng hẹn với đội ngũ kỹ thuật viên chuẩn hãng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center self-start sm:self-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-center gap-3 py-1">
              {/* Step 1 Pill */}
              <div
                onClick={() => setBookingStep(1)}
                className={`flex items-center gap-2 cursor-pointer ${
                  bookingStep === 1 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    bookingStep === 1
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-blue-100 text-blue-700 font-semibold'
                  }`}
                >
                  1
                </div>
                <span className="text-xs">1. Chọn xe</span>
              </div>

              <div className="w-12 h-0.5 bg-blue-500/40" />

              {/* Step 2 Pill */}
              <div
                onClick={() => setBookingStep(2)}
                className={`flex items-center gap-2 cursor-pointer ${
                  bookingStep === 2 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    bookingStep === 2
                      ? 'bg-blue-600 text-white font-bold'
                      : bookingStep > 2
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  2
                </div>
                <span className="text-xs">2. Dịch vụ & Mô tả</span>
              </div>

              <div className="w-12 h-0.5 bg-blue-500/40" />

              {/* Step 3 Pill */}
              <div
                onClick={() => setBookingStep(3)}
                className={`flex items-center gap-2 cursor-pointer ${
                  bookingStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    bookingStep === 3
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span className="text-xs">3. Ngày & Giờ</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* STEP 1: CHỌN XE CẦN LÀM DỊCH VỤ */}
            {/* ---------------------------------------------------- */}
            {bookingStep === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">1. Chọn xe cần làm dịch vụ</h3>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Hồ sơ xe cập nhật
                  </span>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Chọn từ danh sách xe đã đăng ký hồ sơ hoặc thêm xe mới vào xưởng
                </p>

                {/* Vehicle Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Default / Registered Vehicles */}
                  {vehicles.map((v) => {
                    const isSelected = bookingVehicleId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          setBookingVehicleId(v.id);
                          setCustomPlateInput('');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-800">
                              {v.licensePlate}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {v.make} {v.model}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Số km đã đi: 38,500 km</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Đúng hẹn bảo dưỡng
                          </span>
                          <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                            {isSelected ? 'Đang chọn' : 'Chọn xe'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Fallback mock cards if user has few registered vehicles */}
                  {vehicles.length < 2 && (
                    <>
                      <div
                        onClick={() => {
                          setBookingVehicleId(999);
                          setCustomPlateInput('');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          bookingVehicleId === 999
                            ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-800">
                              30H-888.99
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                bookingVehicleId === 999 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {bookingVehicleId === 999 && <span className="material-symbols-outlined text-[13px]">check</span>}
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">Mazda CX-5 2.0L</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Số km đã đi: 18,200 km</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Bảo dưỡng lần trước: 15.000 km</span>
                          <span className={bookingVehicleId === 999 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                            {bookingVehicleId === 999 ? 'Đang chọn' : 'Chọn xe'}
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setBookingVehicleId(998);
                          setCustomPlateInput('');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          bookingVehicleId === 998
                            ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded text-xs font-mono font-bold text-slate-800">
                              29A-678.90
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                bookingVehicleId === 998 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {bookingVehicleId === 998 && <span className="material-symbols-outlined text-[13px]">check</span>}
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">Ford Ranger Wildtrak</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Số km đã đi: 72,000 km</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Bảo dưỡng lần trước: 70.000 km</span>
                          <span className={bookingVehicleId === 998 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                            {bookingVehicleId === 998 ? 'Đang chọn' : 'Chọn xe'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Input New / Custom Plate Option */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>+ Sử dụng xe khác / Nhập biển số mới</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customPlateInput}
                      onChange={(e) => {
                        setCustomPlateInput(e.target.value.toUpperCase());
                        setBookingVehicleId(null);
                      }}
                      placeholder="Ví dụ: 51K-999.88 (Dòng xe)"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPlateInput.trim()) {
                          setBookingVehicleId(0);
                        }
                      }}
                      className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: DỊCH VỤ YÊU CẦU & MÔ TẢ TÌNH TRẠNG */}
            {/* ---------------------------------------------------- */}
            {bookingStep === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">2. Dịch vụ yêu cầu & Mô tả tình trạng</h3>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Lựa chọn các hạng mục cần thực hiện hoặc ghi rõ triệu chứng bất thường
                </p>

                {/* 6 Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isChecked = selectedServiceIds.includes(srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleToggleService(srv.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <span className="material-symbols-outlined text-[13px]">check</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-blue-600 text-[16px]">
                              {srv.icon}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900">{srv.title}</h4>
                            {srv.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                {srv.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{srv.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Symptom Notes Textarea */}
                <div>
                  <div className="mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mô tả chi tiết tình trạng xe (Tiếng kêu lạ, đèn cảnh báo taplo, yêu cầu riêng...)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                    placeholder="Nhập mô tả tình trạng xe của bạn (nếu có)..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Quý khách có thể đính kèm ảnh hoặc video âm thanh bất thường khi mang xe đến xưởng.
                  </p>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: CHỌN NGÀY & KHUNG GIỜ TIẾP NHẬN */}
            {/* ---------------------------------------------------- */}
            {bookingStep === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">3. Chọn ngày & khung giờ tiếp nhận</h3>
                </div>
                <p className="text-xs text-slate-500 -mt-3">
                  Hệ thống phân bổ khoang sửa chữa thông minh tránh tình trạng chờ đợi quá 10 phút
                </p>

                {/* Calendar Picker + Time Slots */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Mini Calendar */}
                  <div className="lg:col-span-5 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-lg">calendar_month</span>
                        <h4 className="font-bold text-xs text-slate-900">
                          Tháng {bookingDate.getMonth() + 1} / {bookingDate.getFullYear()}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(bookingDate);
                            d.setMonth(d.getMonth() - 1);
                            setBookingDate(d);
                          }}
                          className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(bookingDate);
                            d.setMonth(d.getMonth() + 1);
                            setBookingDate(d);
                          }}
                          className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-500"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    {/* Mini Day of Week Header */}
                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 mb-2">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span className="text-red-500">CN</span>
                    </div>

                    {/* Mini Day Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: 30 }, (_, i) => {
                        const dayNum = i + 1;
                        const isSelectedDay = bookingDate.getDate() === dayNum;
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              const newD = new Date(bookingDate);
                              newD.setDate(dayNum);
                              setBookingDate(newD);
                            }}
                            className={`h-7 rounded-lg font-medium text-xs flex items-center justify-center transition-all ${
                              isSelectedDay
                                ? 'bg-blue-600 text-white font-bold shadow-sm'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Ngày đang chọn: <strong>{bookingDate.getDate()}/{bookingDate.getMonth() + 1}</strong>
                      </span>
                      <span>Xưởng mở cửa (07:30 - 17:30)</span>
                    </div>
                  </div>

                  {/* Right: Morning & Afternoon Slots */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Morning Slots */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-500 text-base">wb_sunny</span>
                          Buổi sáng (07:30 - 11:30)
                        </span>
                        <span className="text-[11px] text-slate-400">6/6 khung giờ sẵn sàng</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'].map((slot) => {
                          const isSelected = bookingTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Afternoon Slots */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-blue-500 text-base">wb_twilight</span>
                          Buổi chiều (13:30 - 17:30)
                        </span>
                        <span className="text-[11px] text-slate-400">5 khung giờ sẵn sàng</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['13:30', '14:00', '14:30', '15:00', '16:00'].map((slot) => {
                          const isSelected = bookingTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* VIP Lounge Note */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">
                        schedule
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Thời gian hoàn tất dự kiến:</strong> 1.5 – 2.5 giờ làm việc. Khách hàng có thể nghỉ ngơi tại phòng chờ VIP tiêu chuẩn có Wi-Fi tốc độ cao, nước uống và màn hình theo dõi tiến độ thời gian thực.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Appointment Summary Box */}
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">task_alt</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">Tóm tắt phiếu đặt hẹn:</strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Ưu tiên phục vụ
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5">
                        {customPlateInput || `${selectedVehicleObj?.make || 'Toyota'} ${selectedVehicleObj?.model || 'Vios'} (${selectedVehicleObj?.licensePlate || '51G-123.45'})`} • {selectedServiceIds.length} dịch vụ chọn • <strong className="text-blue-700">{bookingTime} - Ngày {bookingDate.getDate()}/{bookingDate.getMonth() + 1}/{bookingDate.getFullYear()}</strong> • Cố vấn dự kiến: <strong>KTV Trần Văn Nam</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    <span className="block font-semibold text-emerald-700">Miễn phí rửa xe & hút bụi</span>
                    <span>Tặng kèm gói kiểm tra an toàn</span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {bookingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep((bookingStep - 1) as any)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Quay lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Đóng
                </button>
              )}

              {bookingStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep((bookingStep + 1) as any)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  Tiếp tục
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={bookingSubmitting}
                  onClick={handleConfirm3StepBooking}
                  className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {bookingSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  )}
                  Tiếp tục / Xác nhận đặt lịch
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CUSTOMER APPOINTMENT DETAIL MODAL (CUSTOM BUILT FOR CUSTOMER)   */}
      {/* ============================================================== */}
      {selectedAptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Chi tiết lịch hẹn #{selectedAptDetail.id}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedAptDetail.status === 'ARRIVED'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedAptDetail.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedAptDetail.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedAptDetail.status === 'ARRIVED'
                        ? 'Đã tiếp nhận'
                        : selectedAptDetail.status === 'CONFIRMED'
                        ? 'Đã xác nhận'
                        : selectedAptDetail.status === 'CANCELLED'
                        ? 'Đã hủy'
                        : 'Chờ xác nhận'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Trung tâm Car Service Center</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAptDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Info Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Phương tiện:</span>
                <span className="font-bold text-slate-900">
                  {selectedAptDetail.vehicle?.license_plate || '—'} ({selectedAptDetail.vehicle?.make} {selectedAptDetail.vehicle?.model})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian hẹn:</span>
                <span className="font-bold text-blue-700">
                  {(() => {
                    const raw = typeof selectedAptDetail.scheduled_date === 'string'
                      ? selectedAptDetail.scheduled_date.substring(0, 10)
                      : new Date(selectedAptDetail.scheduled_date).toISOString().substring(0, 10);
                    const [y, m, d] = raw.split('-');
                    return `${d}/${m}/${y}`;
                  })()} lúc {selectedAptDetail.scheduled_time_str || selectedAptDetail.scheduled_time}
                </span>
              </div>
              {selectedAptDetail.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Ghi chú của bạn:</span>
                  <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedAptDetail.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Reschedule / Cancel / Close */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {selectedAptDetail.status === 'REQUESTED' || selectedAptDetail.status === 'RESCHEDULED' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleApt(selectedAptDetail);
                      const rawD = typeof selectedAptDetail.scheduled_date === 'string'
                        ? selectedAptDetail.scheduled_date.substring(0, 10)
                        : new Date(selectedAptDetail.scheduled_date).toISOString().substring(0, 10);
                      setRescheduleDate(rawD);
                      setRescheduleTime(selectedAptDetail.scheduled_time_str || '08:30');
                      setSelectedAptDetail(null);
                    }}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Dời ngày/giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelApt(selectedAptDetail);
                      setCancelReason('');
                      setSelectedAptDetail(null);
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Hủy lịch
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                  <span>
                    {selectedAptDetail.status === 'CONFIRMED'
                      ? 'Đơn đã xác nhận không thể hủy hoặc dời (Vui lòng liên hệ hotline)'
                      : selectedAptDetail.status === 'ARRIVED'
                      ? 'Xe đã tiếp nhận tại xưởng, không thể thay đổi'
                      : 'Lịch hẹn đã hủy'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedAptDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all self-end sm:self-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Dời lịch hẹn #{rescheduleApt.id}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Chọn ngày mới</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Chọn giờ mới</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleApt(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRescheduleApt}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Xác nhận dời lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {cancelApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Hủy lịch hẹn #{cancelApt.id}</h3>
            <p className="text-xs text-slate-500">Vui lòng cho biết lý do hủy lịch:</p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tôi bận việc đột xuất..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelApt(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelApt}
                className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Add/Edit Modal (In Child Panel) */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    {vehicleModalMode === 'add' ? 'add_circle' : 'edit'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {vehicleModalMode === 'add' ? 'Thêm phương tiện mới' : 'Chỉnh sửa thông tin xe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVehicleModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">
                  Biển số xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
                  disabled={vehicleModalMode === 'edit'}
                  placeholder="Ví dụ: 51G-123.45"
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 font-mono tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    vehicleModalMode === 'edit' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">
                    Hãng xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    placeholder="Toyota, Honda, Ford..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">
                    Dòng xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="Santa Fe, Everest, Vios..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Năm sản xuất</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                    placeholder="2022"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Màu sơn</label>
                  <input
                    type="text"
                    value={vehicleForm.color}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    placeholder="Trắng, Đen, Xanh..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Phân khúc kích thước</label>
                <select
                  value={vehicleForm.vehicleSize}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleSize: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {VEHICLE_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={vehicleActionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {vehicleActionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">save</span>
                  )}
                  {vehicleModalMode === 'add' ? 'Thêm xe' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirm Modal */}
      {vehicleDeleteConfirm && (
        <ConfirmModal
          isOpen={!!vehicleDeleteConfirm}
          title="Xác nhận xóa xe"
          message={`Bạn có chắc chắn muốn xóa phương tiện biển số ${vehicleDeleteConfirm.licensePlate} (${vehicleDeleteConfirm.make} ${vehicleDeleteConfirm.model}) khỏi danh sách xe của bạn không?`}
          confirmText="Xác nhận xóa"
          onConfirm={handleDeleteVehicle}
          onCancel={() => setVehicleDeleteConfirm(null)}
        />
      )}

      {/* Service Progress Modal (Interactive Stepper Timeline) */}
      {viewProgressItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">timeline</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Tiến độ dịch vụ xe</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Đã hoàn thành
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã phiếu: <strong className="text-slate-800">{viewProgressItem.orderCode}</strong> • Xe: <strong className="text-slate-800">{viewProgressItem.licensePlate}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewProgressItem(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Gói thực hiện:</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewProgressItem.servicePackage}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Cố vấn phụ trách:</span>
                <p className="font-bold text-blue-700 mt-0.5">{viewProgressItem.serviceAdvisor}</p>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-600">
              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">1. Tiếp nhận & Kiểm tra xe ban đầu</h4>
                    <span className="text-[11px] font-medium text-slate-400">08:15</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kiểm tra 24 hạng mục an toàn, chụp ảnh hiện trạng xe và ghi nhận yêu cầu bảo dưỡng.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">2. Lập báo giá & Khách hàng duyệt</h4>
                    <span className="text-[11px] font-medium text-slate-400">08:40</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cố vấn dịch vụ báo giá chi tiết linh kiện & công thợ. Khách hàng đã phê duyệt thực hiện.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">3. Xuất kho phụ tùng & Điều phối khoang</h4>
                    <span className="text-[11px] font-medium text-slate-400">09:00</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xuất linh kiện chính hãng từ kho và phân bổ xe vào cầu nâng số 03.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">4. Kỹ thuật viên tiến hành bảo dưỡng</h4>
                    <span className="text-[11px] font-medium text-slate-400">09:15 - 11:00</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    KTV Lê Văn Hùng hoàn tất thay dầu nhớt, thay lọc, bảo dưỡng hệ thống phanh và kiểm tra gầm.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">5. Kiểm tra chất lượng xuất xưởng (QC)</h4>
                    <span className="text-[11px] font-medium text-slate-400">11:15</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản đốc xưởng chạy thử và nghiệm thu xe đạt tiêu chuẩn an toàn 100%.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <span className="material-symbols-outlined text-[13px]">done_all</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-emerald-800">6. Rửa xe hút bụi & Bàn giao xe</h4>
                    <span className="text-[11px] font-medium text-slate-400">11:45</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vệ sinh sạch sẽ nội ngoại thất và hoàn tất bàn giao xe cho khách hàng.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Thời gian hoàn tất: {viewProgressItem.completedDate} lúc 11:45</span>
              <button
                type="button"
                onClick={() => setViewProgressItem(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {viewInvoiceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-2xl">receipt</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hóa đơn dịch vụ điện tử</h3>
                  <p className="text-xs text-slate-400">{viewInvoiceItem.orderCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoiceItem(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="text-xs space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800">{data?.fullName || 'Khách hàng'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Biển số xe:</span>
                <span className="font-semibold text-slate-800">{viewInvoiceItem.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói thực hiện:</span>
                <span className="font-semibold text-slate-800 text-right">{viewInvoiceItem.servicePackage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày hoàn thành:</span>
                <span className="font-semibold text-slate-800">{viewInvoiceItem.completedDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Tổng thanh toán:</span>
                <span className="font-extrabold text-blue-700 text-sm">{viewInvoiceItem.totalCost}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewInvoiceItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Save Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Lưu thay đổi"
        message="Bạn có chắc chắn muốn lưu thông tin hồ sơ đã thay đổi không?"
        confirmText="Lưu"
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Toasts */}
      {updateSuccess && (
        <Toast
          message="Cập nhật hồ sơ thành công!"
          type="success"
          onClose={() => dispatch(clearUpdateStatus())}
        />
      )}
      {updateError && (
        <Toast
          message={updateError}
          type="error"
          onClose={() => dispatch(clearUpdateStatus())}
        />
      )}
      {vehicleToast && (
        <Toast
          message={vehicleToast.message}
          type={vehicleToast.type}
          onClose={() => setVehicleToast(null)}
        />
      )}
    </div>
  );
}
