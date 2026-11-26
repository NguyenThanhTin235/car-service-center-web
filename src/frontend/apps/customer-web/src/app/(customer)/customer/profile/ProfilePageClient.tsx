'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  consumePendingBookingIntent,
  StoredChatActionPayload,
} from '@/components/chat/aiChatUtils';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProfile, updateProfile, clearUpdateStatus } from '@/store/slices/profileSlice';
import {
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  restoreVehicle,
  Vehicle,
} from '@/store/slices/vehicleSlice';
import {
  fetchAppointments,
  cancelAppointment,
  rescheduleAppointment,
  Appointment,
} from '@/store/slices/appointmentSlice';
import Toast from '@/components/shared/Toast';
import AddressAutocompleteInput from '@/components/shared/AddressAutocompleteInput';
import ConfirmModal from '@/components/shared/ConfirmModal';
import CustomerOverviewTab from '@/components/profile/CustomerOverviewTab';
import { ErrorState, LoadingSkeleton } from '@/components/ui';
import { ALL_BOOKING_SLOTS, formatVehicleSize, isBookingSlotInPast } from '@/utils/customerHelpers';

const TabLoadingFallback = () => (
  <div className="min-h-[520px] py-2">
    <LoadingSkeleton variant="cards" count={3} />
  </div>
);

const TrackingView = dynamic(() => import('@/components/tracking/TrackingView'), {
  loading: TabLoadingFallback,
});
const InvoicesView = dynamic(() => import('@/components/invoices/InvoicesView'), {
  loading: TabLoadingFallback,
});
const HistoryView = dynamic(() => import('@/components/history/HistoryView'), {
  loading: TabLoadingFallback,
});
const WarrantyView = dynamic(() => import('@/components/warranty/WarrantyView'), {
  loading: TabLoadingFallback,
});
const CustomerBookingModal = dynamic(() => import('@/components/profile/CustomerBookingModal'));

export type TabKey = 'overview' | 'profile' | 'vehicles' | 'appointments' | 'tracking' | 'invoices' | 'history' | 'warranty';
const VALID_TABS: TabKey[] = ['overview', 'profile', 'vehicles', 'appointments', 'tracking', 'invoices', 'history', 'warranty'];

// Vehicle Form Types & Presets
interface VehicleFormData {
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'SUV' | 'TRUCK' | 'XL';
}

const VEHICLE_SIZES = [
  { value: 'SMALL', label: 'Nhỏ (< 4.2m - Hatchback, Sedan B)' },
  { value: 'MEDIUM', label: 'Trung bình (4.2–4.6m - Sedan C, Crossover B)' },
  { value: 'LARGE', label: 'Lớn (4.6–5m - Sedan D)' },
  { value: 'SUV', label: 'SUV / Crossover (5–7 chỗ)' },
  { value: 'TRUCK', label: 'Bán tải (Pickup / Truck)' },
];

const EMPTY_VEHICLE_FORM: VehicleFormData = {
  licensePlate: '',
  make: '',
  model: '',
  year: '',
  color: '',
  vehicleSize: 'MEDIUM',
};

export default function ProfilePageClient({ defaultTab }: { defaultTab?: TabKey } = {}) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const authUser = useAppSelector((state) => state.auth.user);
  const { data, loading, error, updateLoading, updateError, updateSuccess } = useAppSelector(
    (state) => state.profile
  );
  const {
    vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    actionLoading: vehicleActionLoading,
  } = useAppSelector((state) => state.vehicles);
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useAppSelector((state) => state.appointments);

  // Active Tab State
  const initialTab = (searchParams.get('tab') as TabKey) || defaultTab || 'overview';
  // Sync activeTab when searchParams changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Listen for instant tab switch events from PublicHeader / PublicFooter & browser history
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCustomSwitch = (ev: Event) => {
      const nextTab = (ev as CustomEvent<TabKey>).detail;
      if (nextTab && VALID_TABS.includes(nextTab)) {
        setActiveTab(nextTab);
      }
    };
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabKey;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener('csc:switch-tab', handleCustomSwitch);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('csc:switch-tab', handleCustomSwitch);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // On-demand chunk prefetch on tab hover/focus instead of eager multi-chunk preload at mount
  const prefetchedTabsRef = useRef<Set<TabKey>>(new Set());
  const prefetchTab = useCallback((key: TabKey) => {
    if (prefetchedTabsRef.current.has(key)) return;
    prefetchedTabsRef.current.add(key);
    if (key === 'tracking') void import('@/components/tracking/TrackingView');
    else if (key === 'invoices') void import('@/components/invoices/InvoicesView');
    else if (key === 'history') void import('@/components/history/HistoryView');
    else if (key === 'warranty') void import('@/components/warranty/WarrantyView');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const msg = sessionStorage.getItem('auth_toast');
      if (msg) {
        setVehicleToast({ message: msg, type: 'success' });
        sessionStorage.removeItem('auth_toast');
      }
    }
  }, []);

  const handleTabChange = useCallback((key: TabKey) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `/customer/profile?tab=${key}`);
  }, []);
  const [activeTab, setActiveTab] = useState<TabKey>(
    VALID_TABS.includes(initialTab) ? initialTab : 'overview'
  );

  // Profile Form States
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<'fullName' | 'phone' | 'email' | 'address', string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Vehicle Management State in child panel
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState<'add' | 'edit'>('add');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormData>(EMPTY_VEHICLE_FORM);
  const [vehicleErrors, setVehicleErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
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
  const [aptActionLoading, setAptActionLoading] = useState(false);

  useEffect(() => {
    if (!selectedAptDetail && !rescheduleApt && !cancelApt && !vehicleModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (aptActionLoading || vehicleActionLoading) return;
      if (cancelApt) {
        setCancelApt(null);
      } else if (rescheduleApt) {
        setRescheduleApt(null);
      } else if (vehicleModalOpen) {
        setVehicleModalOpen(false);
      } else if (selectedAptDetail) {
        setSelectedAptDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAptDetail, rescheduleApt, cancelApt, vehicleModalOpen, aptActionLoading, vehicleActionLoading]);

  // ----------------------------------------------------
  // 3-STEP APPOINTMENT BOOKING MODAL TRIGGER STATE
  // ----------------------------------------------------
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [bookingTime, setBookingTime] = useState<string>('08:00');
  const [bookingPreselectedVehicleId, setBookingPreselectedVehicleId] = useState<number | null>(null);
  const [bookingPreselectedServiceIds, setBookingPreselectedServiceIds] = useState<number[] | undefined>(
    undefined
  );
  const [bookingPreselectedNotes, setBookingPreselectedNotes] = useState<string | undefined>(undefined);
  const [bookingIsWarranty, setBookingIsWarranty] = useState<boolean>(false);
  const [bookingWarrantyItemIds, setBookingWarrantyItemIds] = useState<string[] | undefined>(undefined);
  const consumedBookingIntentRef = useRef(false);

  const effectiveCustomerId = data?.id ?? authUser?.id;

  // Load initial data
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Fetch appointments strictly once for this customer without double-firing on mount
  useEffect(() => {
    if (effectiveCustomerId) {
      dispatch(fetchAppointments({ customer_id: effectiveCustomerId }));
    } else if (!loading) {
      dispatch(fetchAppointments({}));
    }
  }, [effectiveCustomerId, loading, dispatch]);

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

  // Auto-dismiss profile success message
  useEffect(() => {
    if (updateSuccess) {
      setIsEditing(false);
      const t = setTimeout(() => dispatch(clearUpdateStatus()), 3000);
      return () => clearTimeout(t);
    }
  }, [updateSuccess, dispatch]);

  const EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  const FULL_NAME_REGEX = /^[\p{L}\s'.-]+$/u;
  const VN_LICENSE_PLATE_REGEX =
    /^[0-9]{2}[A-Z]{1,2}[A-Z0-9]?[-\s.]?[0-9]{3,5}(?:\.[0-9]{2})?$/;

  const validateProfileField = (
    field: 'fullName' | 'phone' | 'email' | 'address',
    value: string
  ): string | undefined => {
    const trimmed = value.trim();
    if (field === 'fullName') {
      if (!trimmed) return 'Họ và tên không được để trống';
      if (trimmed.length < 2) return 'Họ và tên phải có tối thiểu 2 ký tự';
      if (trimmed.length > 120) return 'Họ và tên không được vượt quá 120 ký tự';
      if (!FULL_NAME_REGEX.test(trimmed)) {
        return 'Họ và tên không đúng định dạng (chỉ chứa chữ cái và khoảng trắng)';
      }
      return undefined;
    }
    if (field === 'phone') {
      if (!trimmed) return 'Số điện thoại không được để trống';
      const cleaned = trimmed.replace(/[\s.-]/g, '');
      if (!VN_PHONE_REGEX.test(cleaned)) {
        return 'Số điện thoại không đúng định dạng (gồm 10 chữ số, VD: 0901234567)';
      }
      return undefined;
    }
    if (field === 'email') {
      if (!trimmed) return 'Email không được để trống';
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Email không đúng định dạng (VD: example@gmail.com)';
      }
      return undefined;
    }
    if (field === 'address') {
      if (!trimmed) return undefined;
      if (trimmed.length < 5) return 'Địa chỉ liên hệ phải có tối thiểu 5 ký tự';
      if (trimmed.length > 255) return 'Địa chỉ liên hệ không được vượt quá 255 ký tự';
      return undefined;
    }
    return undefined;
  };

  const handleProfileInputChange = (
    field: 'fullName' | 'phone' | 'email' | 'address',
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (isEditing) {
      const errMsg = validateProfileField(field, value);
      setProfileErrors((prev) => ({ ...prev, [field]: errMsg }));
    }
  };

  const validateVehicleField = (
    field: keyof VehicleFormData,
    value: string,
    mode: 'add' | 'edit' = vehicleModalMode
  ): string | undefined => {
    const trimmed = value.trim();
    if (field === 'licensePlate') {
      if (mode === 'edit') return undefined;
      if (!trimmed) return 'Biển số xe không được để trống';
      if (!VN_LICENSE_PLATE_REGEX.test(trimmed.toUpperCase())) {
        return 'Biển số xe không đúng định dạng (VD: 51G-123.45 hoặc 30A-12345)';
      }
      return undefined;
    }
    if (field === 'make') {
      if (!trimmed) return 'Hãng xe không được để trống';
      if (trimmed.length < 2 || trimmed.length > 50) {
        return 'Hãng xe phải có từ 2 đến 50 ký tự';
      }
      return undefined;
    }
    if (field === 'model') {
      if (!trimmed) return 'Dòng xe không được để trống';
      if (trimmed.length > 50) return 'Dòng xe không được vượt quá 50 ký tự';
      return undefined;
    }
    if (field === 'year') {
      if (!trimmed) return undefined;
      const maxYear = new Date().getFullYear() + 1;
      const num = Number(trimmed);
      if (!Number.isInteger(num) || num < 1980 || num > maxYear) {
        return `Năm sản xuất không hợp lệ (1980 - ${maxYear})`;
      }
      return undefined;
    }
    if (field === 'color') {
      if (!trimmed) return undefined;
      if (!/^[\p{L}\s/-]{1,30}$/u.test(trimmed)) {
        return 'Màu sơn không đúng định dạng (chỉ chứa chữ cái, tối đa 30 ký tự)';
      }
      return undefined;
    }
    return undefined;
  };

  const handleVehicleInputChange = (field: keyof VehicleFormData, value: string) => {
    setVehicleForm((prev) => ({ ...prev, [field]: value }));
    const errMsg = validateVehicleField(field, value);
    setVehicleErrors((prev) => ({ ...prev, [field]: errMsg }));
  };

  const requestSave = () => {
    const nextErrors: Partial<Record<'fullName' | 'phone' | 'email' | 'address', string>> = {
      fullName: validateProfileField('fullName', form.fullName),
      phone: validateProfileField('phone', form.phone),
      email: validateProfileField('email', form.email),
      address: validateProfileField('address', form.address),
    };
    setProfileErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    dispatch(updateProfile({
      fullName: form.fullName.trim(),
      phone: form.phone.trim().replace(/[\s.-]/g, ''),
      email: form.email.trim(),
      address: form.address.trim(),
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
    setProfileErrors({});
    setIsEditing(false);
    dispatch(clearUpdateStatus());
  };

  // Vehicle Management handlers
  const handleOpenAddVehicle = () => {
    setVehicleModalMode('add');
    setSelectedVehicle(null);
    setVehicleForm(EMPTY_VEHICLE_FORM);
    setVehicleErrors({});
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
    setVehicleErrors({});
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextVehErrors: Partial<Record<keyof VehicleFormData, string>> = {
      licensePlate: validateVehicleField('licensePlate', vehicleForm.licensePlate, vehicleModalMode),
      make: validateVehicleField('make', vehicleForm.make, vehicleModalMode),
      model: validateVehicleField('model', vehicleForm.model, vehicleModalMode),
      year: validateVehicleField('year', vehicleForm.year, vehicleModalMode),
      color: validateVehicleField('color', vehicleForm.color, vehicleModalMode),
    };
    setVehicleErrors(nextVehErrors);
    if (Object.values(nextVehErrors).some(Boolean)) {
      return;
    }

    try {
      if (vehicleModalMode === 'add') {
        const created = await dispatch(createVehicle({
          licensePlate: vehicleForm.licensePlate.trim().toUpperCase(),
          make: vehicleForm.make.trim(),
          model: vehicleForm.model.trim(),
          year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
          color: vehicleForm.color ? vehicleForm.color.trim() : undefined,
          vehicleSize: vehicleForm.vehicleSize,
        })).unwrap();
        if (bookingModalOpen && created?.id) {
          setBookingPreselectedVehicleId(created.id);
        }
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
      const errMsg = typeof err === 'string' ? err : 'Thao tác không thành công';
      if (/biển số|tồn tại/i.test(errMsg)) {
        setVehicleErrors((prev) => ({ ...prev, licensePlate: errMsg }));
      } else {
        setVehicleToast({ message: errMsg, type: 'error' });
      }
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleDeleteConfirm) return;
    try {
      const res = await dispatch(deleteVehicle(vehicleDeleteConfirm.id)).unwrap();
      setVehicleToast({
        message:
          res.message ||
          (res.deactivated
            ? 'Xe đã có lịch sử dịch vụ, đã được vô hiệu hóa thay vì xóa.'
            : 'Đã xóa phương tiện thành công!'),
        type: 'success',
      });
      setVehicleDeleteConfirm(null);
      dispatch(fetchVehicles());
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Không thể xóa phương tiện này', type: 'error' });
      setVehicleDeleteConfirm(null);
    }
  };

  const handleRestoreVehicle = async (vehicleId: number) => {
    try {
      const res = await dispatch(restoreVehicle(vehicleId)).unwrap();
      setVehicleToast({
        message: res.message || 'Đã kích hoạt lại phương tiện thành công!',
        type: 'success',
      });
      dispatch(fetchVehicles());
    } catch (err: any) {
      setVehicleToast({
        message: typeof err === 'string' ? err : 'Không thể kích hoạt lại phương tiện này',
        type: 'error',
      });
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
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const cellStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const isPast = cellStart < todayStart;

      // Construct local YYYY-MM-DD string to avoid UTC timezone offset shift
      const cellYear = d.getFullYear();
      const cellMonth = String(d.getMonth() + 1).padStart(2, '0');
      const cellDate = String(d.getDate()).padStart(2, '0');
      const cellDateStr = `${cellYear}-${cellMonth}-${cellDate}`;

      const effectiveCustomerId = data?.id;

      const dayApts = appointments.filter((a) => {
        // Only show appointments belonging to this customer if customer ID is known
        if (effectiveCustomerId && a.customer_id && a.customer_id !== effectiveCustomerId) {
          return false;
        }
        let aDateStr = '';
        if (typeof a.scheduled_date === 'string') {
          aDateStr = a.scheduled_date.includes('T') ? a.scheduled_date.split('T')[0] : a.scheduled_date.substring(0, 10);
        } else if (a.scheduled_date) {
          const dt = new Date(a.scheduled_date);
          aDateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        }
        return aDateStr === cellDateStr;
      });

      return {
        date: d,
        dateNum: d.getDate(),
        dateStr: cellDateStr,
        isCurrentMonth,
        isToday,
        isPast,
        appointments: dayApts,
      };
    });
  }, [calendarDate, appointments, data?.id]);

  const handleOpen3StepBooking = (initialDate?: Date) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let targetDate = initialDate ? new Date(initialDate) : new Date();
    const targetDayStart = new Date(targetDate);
    targetDayStart.setHours(0, 0, 0, 0);

    if (targetDayStart < todayStart) {
      targetDate = new Date();
      setVehicleToast({ message: 'Không thể đặt lịch cho ngày trong quá khứ.', type: 'error' });
    }

    const firstValidSlot = ALL_BOOKING_SLOTS.find((slot) => !isBookingSlotInPast(targetDate, slot));
    if (firstValidSlot) {
      setBookingDate(targetDate);
      setBookingTime(firstValidSlot);
    } else {
      const tomorrow = new Date(targetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow);
      setBookingTime('08:00');
    }

    setBookingPreselectedServiceIds(undefined);
    setBookingPreselectedNotes(undefined);
    setBookingIsWarranty(false);
    setBookingWarrantyItemIds(undefined);
    setBookingModalOpen(true);
  };

  const openBookingModalWithIntent = useCallback((intent?: StoredChatActionPayload | null) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let targetDate = new Date();
    if (intent?.preferredDate) {
      const parsed = new Date(`${intent.preferredDate}T00:00:00`);
      if (!isNaN(parsed.getTime()) && parsed >= todayStart) {
        targetDate = parsed;
      }
    }

    let targetTime =
      intent?.preferredTime && ALL_BOOKING_SLOTS.includes(intent.preferredTime)
        ? intent.preferredTime
        : ALL_BOOKING_SLOTS.find((slot) => !isBookingSlotInPast(targetDate, slot)) || '';

    if (!targetTime) {
      const tomorrow = new Date(targetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      targetDate = tomorrow;
      targetTime = '08:00';
    }

    setBookingDate(targetDate);
    setBookingTime(targetTime);
    setBookingPreselectedVehicleId(intent?.preselectedVehicleId ?? null);
    setBookingPreselectedServiceIds(
      intent?.preselectedServiceIds && intent.preselectedServiceIds.length > 0
        ? intent.preselectedServiceIds
        : undefined
    );
    setBookingPreselectedNotes(intent?.notes || undefined);
    setBookingIsWarranty(Boolean(intent?.isWarranty));
    setBookingWarrantyItemIds(undefined);
    setBookingModalOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldOpenFromQuery = searchParams.get('openBooking') === '1';
    const isWarrantyFromQuery = searchParams.get('warranty') === 'true';
    const warrantyVehicleId = searchParams.get('vehicle_id');
    const warrantyItemId = searchParams.get('warranty_item_id');
    const pendingIntent = consumePendingBookingIntent(window.sessionStorage);

    if ((shouldOpenFromQuery || isWarrantyFromQuery || pendingIntent) && !consumedBookingIntentRef.current) {
      consumedBookingIntentRef.current = true;
      if (isWarrantyFromQuery) {
        openBookingModalWithIntent({
          isWarranty: true,
          preselectedVehicleId: warrantyVehicleId ? Number(warrantyVehicleId) : undefined,
        });
        if (warrantyItemId) {
          setBookingWarrantyItemIds([warrantyItemId]);
        }
      } else {
        openBookingModalWithIntent(pendingIntent);
      }
      if (shouldOpenFromQuery || isWarrantyFromQuery) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('openBooking');
        cleanUrl.searchParams.delete('warranty');
        cleanUrl.searchParams.delete('vehicle_id');
        cleanUrl.searchParams.delete('warranty_item_id');
        cleanUrl.searchParams.delete('warranty_item_name');
        window.history.replaceState(null, '', cleanUrl.pathname + cleanUrl.search);
      }
    }
  }, [searchParams, openBookingModalWithIntent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEvent = (ev: Event) => {
      const customEv = ev as CustomEvent<StoredChatActionPayload>;
      openBookingModalWithIntent(customEv.detail || null);
    };
    window.addEventListener('csc:open-booking-modal', handleEvent);
    return () => window.removeEventListener('csc:open-booking-modal', handleEvent);
  }, [openBookingModalWithIntent]);

  // Appointment Action handlers
  const handleConfirmCancelApt = async () => {
    if (!cancelApt || aptActionLoading) return;
    setAptActionLoading(true);
    try {
      await dispatch(cancelAppointment({ id: cancelApt.id, reason: cancelReason || 'Khách hàng bận' })).unwrap();
      setVehicleToast({ message: 'Đã hủy lịch hẹn thành công.', type: 'success' });
      setCancelApt(null);
      setSelectedAptDetail(null);
      dispatch(fetchAppointments(data?.id ? { customer_id: data.id } : {}));
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Lỗi khi hủy lịch', type: 'error' });
    } finally {
      setAptActionLoading(false);
    }
  };

  const handleConfirmRescheduleApt = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) {
      setVehicleToast({ message: 'Vui lòng chọn đầy đủ ngày và giờ mới.', type: 'error' });
      return;
    }
    if (aptActionLoading) return;
    setAptActionLoading(true);
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
      dispatch(fetchAppointments(data?.id ? { customer_id: data.id } : {}));
    } catch (err: any) {
      setVehicleToast({ message: typeof err === 'string' ? err : 'Lỗi khi dời lịch', type: 'error' });
    } finally {
      setAptActionLoading(false);
    }
  };

  // Get initials for Avatar (e.g. "Đinh Duẫn Phan" -> "ĐP")
  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const inputClass = (editable: boolean, hasError = false) =>
    `w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm transition-all duration-150 ${!editable
      ? 'border-hairline bg-surface-subtle text-ink-primary cursor-default'
      : hasError
        ? 'border-status-danger bg-status-danger-soft/30 text-ink-primary focus:outline-none focus:ring-2 focus:ring-status-danger/20 focus:border-status-danger'
        : 'border-accent bg-surface-elevated text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent'
    }`;

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.isActive !== false),
    [vehicles]
  );

  // 7 Tabs in Vertical Sidebar (including Overview, UC-15 Tracking & UC-16 Invoices)
  const navTabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Tổng quan', icon: 'dashboard' },
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: 'account_circle' },
    { key: 'vehicles', label: 'Xe của tôi', icon: 'directions_car' },
    { key: 'appointments', label: 'Đặt lịch', icon: 'calendar_today' },
    { key: 'tracking', label: 'Tiến độ sửa chữa', icon: 'car_repair' },
    { key: 'invoices', label: 'Hóa đơn dịch vụ', icon: 'receipt_long' },
    { key: 'history', label: 'Lịch sử sửa chữa', icon: 'history' },
    { key: 'warranty', label: 'Bảo hành', icon: 'verified_user' },
  ];

  if (loading && !data) {
    return (
      <div className="py-6">
        <LoadingSkeleton variant="cards" count={3} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <ErrorState
          title="Không thể tải hồ sơ khách hàng"
          message={error}
          onRetry={() => dispatch(fetchProfile())}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-5">
        <Link href="/home" className="hover:text-accent transition-colors">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          chevron_right
        </span>
        <span className="text-ink-primary font-semibold">
          {navTabs.find((t) => t.key === activeTab)?.label || 'Tổng quan'}
        </span>
      </nav>

      {/* Main Grid: Left Sidebar Tabs + Right Content */}
      <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">

        {/* Left Column: Sidebar Tabs */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-4">
          {/* User Card */}
          <div className="bg-surface-elevated rounded-2xl p-4 border border-hairline flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-base shrink-0">
              {getInitials(data?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-ink-primary truncate">
                {data?.fullName || 'Khách hàng'}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Khách hàng AutoCare Pro
              </p>
            </div>
          </div>

          {/* Navigation Tabs (horizontal scrollable strip with scrollbar on mobile, vertical list on md+) */}
          <nav
            className="flex md:flex-col gap-1.5 overflow-x-auto styled-scrollbar-x pb-2.5 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0"
            aria-label="Điều hướng cổng khách hàng"
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  onMouseEnter={() => prefetchTab(tab.key)}
                  onFocus={() => prefetchTab(tab.key)}
                  className={`shrink-0 md:w-full min-h-[44px] flex items-center gap-2.5 md:gap-3.5 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-sm font-medium transition-colors text-left cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-accent text-white font-semibold'
                      : 'bg-surface-elevated md:bg-transparent border border-hairline md:border-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg md:text-xl transition-colors ${
                      isActive ? 'text-white' : 'text-ink-muted'
                    }`}
                    aria-hidden="true"
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

          {/* TAB 0: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <CustomerOverviewTab onSelectTab={handleTabChange} />
          )}

          {/* TAB 1: HỒ SƠ CÁ NHÂN */}
          {activeTab === 'profile' && (
            <div className="bg-surface-elevated rounded-2xl p-5 sm:p-8 border border-hairline space-y-6">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline">
                <h2 className="text-xl font-bold text-ink-primary">Hồ sơ cá nhân</h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">
                      edit
                    </span>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">person</span>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => handleProfileInputChange('fullName', e.target.value)}
                        onBlur={(e) => isEditing && handleProfileInputChange('fullName', e.target.value)}
                        readOnly={!isEditing}
                        aria-invalid={Boolean(profileErrors.fullName)}
                        className={`${inputClass(isEditing, Boolean(profileErrors.fullName))} pl-10`}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    {isEditing && profileErrors.fullName && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{profileErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">phone</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                        onBlur={(e) => isEditing && handleProfileInputChange('phone', e.target.value)}
                        readOnly={!isEditing}
                        aria-invalid={Boolean(profileErrors.phone)}
                        className={`${inputClass(isEditing, Boolean(profileErrors.phone))} pl-10`}
                        placeholder="Nhập số điện thoại (VD: 0901234567)"
                      />
                    </div>
                    {isEditing && profileErrors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{profileErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleProfileInputChange('email', e.target.value)}
                        onBlur={(e) => isEditing && handleProfileInputChange('email', e.target.value)}
                        readOnly={!isEditing}
                        aria-invalid={Boolean(profileErrors.email)}
                        className={`${inputClass(isEditing, Boolean(profileErrors.email))} pl-10`}
                        placeholder="Nhập email (VD: example@gmail.com)"
                      />
                    </div>
                    {isEditing && profileErrors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{profileErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Địa chỉ liên hệ
                    </label>
                    <AddressAutocompleteInput
                      value={form.address}
                      onChange={(val) => handleProfileInputChange('address', val)}
                      onBlur={() => isEditing && handleProfileInputChange('address', form.address)}
                      readOnly={!isEditing}
                      hasError={Boolean(profileErrors.address)}
                      className={inputClass(isEditing, Boolean(profileErrors.address))}
                      placeholder="Nhập địa chỉ của bạn"
                    />
                    {isEditing && profileErrors.address && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        <span>{profileErrors.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-hairline">
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-3">
                    Thông tin tài khoản
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Ngày tham gia</p>
                      <p className="font-semibold text-ink-primary font-mono tabular-nums">
                        {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Trạng thái</p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          data?.isActive
                            ? 'bg-status-success-soft text-on-secondary-container'
                            : 'bg-status-danger-soft text-on-error-container'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {data?.isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={requestSave}
                      disabled={updateLoading}
                      className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {updateLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">
                          save
                        </span>
                      )}
                      {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={updateLoading}
                      className="min-h-[44px] px-5 py-2.5 border border-hairline-strong text-ink-secondary rounded-xl text-sm font-medium hover:bg-surface-subtle transition-colors cursor-pointer"
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
                <h2 className="text-xl font-bold text-slate-900">Xe của tôi</h2>
                <button
                  type="button"
                  onClick={handleOpenAddVehicle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-center"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Thêm xe mới
                </button>
              </div>

              {vehiclesLoading && vehicles.length === 0 ? (
                <LoadingSkeleton variant="cards" count={2} />
              ) : vehiclesError && vehicles.length === 0 ? (
                <ErrorState
                  title="Không thể tải danh sách xe"
                  message={vehiclesError}
                  onRetry={() => dispatch(fetchVehicles())}
                />
              ) : vehicles.length === 0 ? (
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
                    const sizeText = formatVehicleSize(v.vehicleSize);
                    const activeWO = v.activeWorkOrder;
                    return (
                      <div
                        key={v.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                            <span className="px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg tracking-wider shadow-sm">
                              {v.licensePlate}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {activeWO && (
                                <span
                                  title={`Phiếu công việc ${activeWO.woNumber} đang xử lý tại xưởng`}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Đang có phiếu công việc ({activeWO.woNumber})
                                </span>
                              )}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${v.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500'
                                  }`}
                              >
                                {v.isActive ? 'Hoạt động' : 'Tạm dừng'}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-bold text-base text-slate-900 leading-snug">
                            {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                          </h3>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[11px] text-slate-400 shrink-0">Màu sắc:</span>
                              <strong className="text-slate-700 font-semibold truncate">{v.color || 'Không rõ'}</strong>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[11px] text-slate-400 shrink-0">Kích thước:</span>
                              <strong className="text-slate-700 font-semibold truncate">{sizeText || 'Tiêu chuẩn'}</strong>
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
                          {!activeWO && (
                            v.isActive ? (
                              v.hasTransactions ? (
                                <button
                                  type="button"
                                  title="Xe đã phát sinh giao dịch, chỉ có thể vô hiệu hóa"
                                  onClick={() => setVehicleDeleteConfirm(v)}
                                  className="flex items-center gap-1 px-3 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold transition-all"
                                >
                                  <span className="material-symbols-outlined text-[15px]">block</span>
                                  Vô hiệu hóa
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Xóa phương tiện"
                                  onClick={() => setVehicleDeleteConfirm(v)}
                                  className="flex items-center gap-1 px-3 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                  Xóa
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRestoreVehicle(v.id)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-all"
                              >
                                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                                Kích hoạt lại
                              </button>
                            )
                          )}
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
                <h2 className="text-xl font-bold text-slate-900">Lịch hẹn dịch vụ</h2>

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

              {/* Large Monthly Calendar Grid (horizontally scrollable on 390px mobile) */}
              {appointmentsLoading && appointments.length === 0 ? (
                <LoadingSkeleton variant="cards" count={3} />
              ) : appointmentsError && appointments.length === 0 ? (
                <ErrorState
                  title="Không thể tải lịch hẹn dịch vụ"
                  message={appointmentsError}
                  onRetry={() => dispatch(fetchAppointments(data?.id ? { customer_id: data.id } : {}))}
                />
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-x-auto styled-scrollbar-x shadow-sm">
                  <div className="min-w-[640px]">
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
                            if (!cell.isPast) {
                              handleOpen3StepBooking(cell.date);
                            }
                          }}
                          className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${cell.isPast
                              ? `bg-slate-50/70 text-slate-400 ${cell.appointments.length === 0 ? 'cursor-not-allowed' : 'cursor-default'}`
                              : `cursor-pointer group ${!cell.isCurrentMonth
                                  ? 'bg-slate-50/50 text-slate-300'
                                  : cell.isToday
                                    ? 'bg-blue-50/40'
                                    : 'hover:bg-blue-50/20'
                                }`
                            }`}
                        >
                          {/* Date Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${cell.isToday
                                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                                  : cell.isPast || !cell.isCurrentMonth
                                    ? 'text-slate-400'
                                    : 'text-slate-800'
                                }`}
                            >
                              {cell.dateNum}
                            </span>
                            {cell.isCurrentMonth && !cell.isPast && (
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
                                className={`p-1.5 rounded-lg text-[11px] font-medium transition-all shadow-xs flex items-center justify-between ${apt.status === 'ARRIVED'
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
            </div>
          )}

          {/* TAB: TIẾN ĐỘ SỬA CHỮA (UC-15) */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <TrackingView isEmbedded />
            </div>
          )}

          {/* TAB: HÓA ĐƠN DỊCH VỤ (UC-16) */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <InvoicesView isEmbedded />
            </div>
          )}

          {/* TAB 4: LỊCH SỬ DỊCH VỤ */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <HistoryView
                isEmbedded
                onViewTracking={() => handleTabChange('tracking')}
                onBookNew={() => {
                  handleTabChange('appointments');
                  handleOpen3StepBooking(new Date());
                }}
              />
            </div>
          )}

          {/* TAB 8: BẢO HÀNH & HẬU MÃI */}
          {activeTab === 'warranty' && (
            <WarrantyView
              isEmbedded
              onBookWarranty={({ vehicleId, warrantyItemId }) => {
                openBookingModalWithIntent({
                  isWarranty: true,
                  preselectedVehicleId: vehicleId,
                });
                setBookingWarrantyItemIds(warrantyItemId ? [warrantyItemId] : undefined);
              }}
            />
          )}

        </main>
      </div>

      {/* ============================================================== */}
      {/* 3-STEP APPOINTMENT BOOKING MODAL (LAZY-LOADED)                 */}
      {/* ============================================================== */}
      {bookingModalOpen && (
        <CustomerBookingModal
          initialDate={bookingDate}
          initialTime={bookingTime}
          initialVehicleId={bookingPreselectedVehicleId}
          initialServiceIds={bookingPreselectedServiceIds}
          initialNotes={bookingPreselectedNotes}
          initialIsWarranty={bookingIsWarranty}
          initialWarrantyItemIds={bookingWarrantyItemIds}
          customerId={data?.id}
          vehicles={vehicles}
          activeVehicles={activeVehicles}
          appointments={appointments}
          onClose={() => setBookingModalOpen(false)}
          onOpenAddVehicle={() => {
            setVehicleModalMode('add');
            setSelectedVehicle(null);
            setVehicleForm(EMPTY_VEHICLE_FORM);
            setVehicleModalOpen(true);
          }}
          onToast={setVehicleToast}
        />
      )}

      {/* ============================================================== */}
      {/* CUSTOMER APPOINTMENT DETAIL MODAL (CUSTOM BUILT FOR CUSTOMER)   */}
      {/* ============================================================== */}
      {selectedAptDetail && (() => {
        const rawDate = typeof selectedAptDetail.scheduled_date === 'string'
          ? selectedAptDetail.scheduled_date.substring(0, 10)
          : new Date(selectedAptDetail.scheduled_date).toISOString().substring(0, 10);
        const [yStr, mStr, dStr] = rawDate.split('-');
        const dateObj = new Date(Number(yStr), Number(mStr) - 1, Number(dStr));
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const weekdayLabel = dayNames[dateObj.getDay()] || '';
        const timeStr = selectedAptDetail.scheduled_time_str || selectedAptDetail.scheduled_time || '08:00';
        const hourNum = parseInt(timeStr.split(':')[0] || '8', 10);
        const periodLabel = hourNum < 12 ? 'Buổi sáng' : 'Buổi chiều';

        const matchedVehicle = vehicles.find(
          (v) => Number(v.id) === Number(selectedAptDetail.vehicle_id || selectedAptDetail.vehicle?.id)
        );
        const plateText = selectedAptDetail.vehicle?.license_plate || matchedVehicle?.licensePlate || '—';
        const makeModelText = `${selectedAptDetail.vehicle?.make || matchedVehicle?.make || ''} ${selectedAptDetail.vehicle?.model || matchedVehicle?.model || ''}`.trim() || 'Chưa rõ dòng xe';
        const sizeLabelMap: Record<string, string> = {
          SMALL: 'Nhỏ',
          MEDIUM: 'Trung bình',
          LARGE: 'Lớn',
          SUV: 'SUV / Crossover',
          TRUCK: 'Bán tải',
          XL: 'Cỡ lớn',
        };

        const statusMeta: Record<string, { label: string; badgeClass: string; stepIndex: number }> = {
          REQUESTED: { label: 'Chờ xác nhận', badgeClass: 'bg-blue-100 text-blue-800', stepIndex: 1 },
          RESCHEDULED: { label: 'Đã dời lịch', badgeClass: 'bg-amber-100 text-amber-800', stepIndex: 1 },
          CONFIRMED: { label: 'Đã xác nhận', badgeClass: 'bg-emerald-100 text-emerald-800', stepIndex: 2 },
          ARRIVED: { label: 'Đã tiếp nhận', badgeClass: 'bg-purple-100 text-purple-800', stepIndex: 3 },
          CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-red-100 text-red-800', stepIndex: 0 },
        };
        const currentStatus = statusMeta[selectedAptDetail.status] || statusMeta.REQUESTED;
        const aptServices = selectedAptDetail.services || [];

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết lịch hẹn #${selectedAptDetail.id}`}
            onClick={() => setSelectedAptDetail(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cw-modal-overlay"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-5 cw-modal-panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">event_available</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        Chi tiết lịch hẹn #{selectedAptDetail.id}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentStatus.badgeClass}`}>
                        {currentStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phiếu đặt lịch dịch vụ • Trung tâm AutoCare Pro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAptDetail(null)}
                  aria-label="Đóng chi tiết lịch hẹn"
                  className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Status Timeline or Cancelled Alert */}
              {selectedAptDetail.status === 'CANCELLED' ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs">
                  <span className="material-symbols-outlined text-red-600 text-lg shrink-0 mt-0.5">cancel</span>
                  <div>
                    <p className="font-bold text-red-800">Lịch hẹn này đã bị hủy</p>
                    <p className="text-red-700 mt-0.5">
                      Lý do: {selectedAptDetail.cancel_reason || 'Không có lý do cụ thể'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        step: 1,
                        title: selectedAptDetail.status === 'RESCHEDULED' ? 'Đã dời lịch' : 'Đã gửi yêu cầu',
                        icon: 'edit_calendar',
                      },
                      { step: 2, title: 'Xưởng xác nhận', icon: 'verified' },
                      { step: 3, title: 'Tiếp nhận xe', icon: 'directions_car' },
                    ].map((item) => {
                      const done = currentStatus.stepIndex >= item.step;
                      const active = currentStatus.stepIndex === item.step;
                      return (
                        <div
                          key={item.step}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${active
                              ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                              : done
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                        >
                          <span className="material-symbols-outlined text-base shrink-0">
                            {done && !active ? 'check_circle' : item.icon}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2-Column Detailed Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Schedule & Workshop */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span className="material-symbols-outlined text-sm text-blue-600">schedule</span>
                    <span>Thời gian &amp; Địa điểm</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Ngày hẹn:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {weekdayLabel}, {dStr}/{mStr}/{yStr}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Khung giờ:</span>
                      <span className="font-bold text-blue-700 text-right">
                        {timeStr} ({periodLabel})
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Địa điểm:</span>
                      <span className="font-semibold text-slate-800 text-right">AutoCare Pro</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/70 text-[11px] text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">local_car_wash</span>
                      <span>Miễn phí rửa xe, hút bụi &amp; kiểm tra an toàn</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Customer */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span className="material-symbols-outlined text-sm text-blue-600">directions_car</span>
                    <span>Phương tiện &amp; Liên hệ</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Biển số xe:</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-bold text-slate-900">
                        {plateText}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Hãng &amp; Dòng xe:</span>
                      <span className="font-bold text-slate-900 text-right">{makeModelText}</span>
                    </div>
                    {(matchedVehicle?.color || matchedVehicle?.year || matchedVehicle?.vehicleSize) && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Thông số:</span>
                        <span className="text-slate-700 text-right">
                          {[
                            matchedVehicle.color ? `Màu ${matchedVehicle.color}` : null,
                            matchedVehicle.year ? `Đời ${matchedVehicle.year}` : null,
                            matchedVehicle.vehicleSize ? `Cỡ ${sizeLabelMap[matchedVehicle.vehicleSize] || matchedVehicle.vehicleSize}` : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200/70 flex justify-between gap-2">
                      <span className="text-slate-500">Khách hàng:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {selectedAptDetail.customer?.full_name || data?.fullName || '—'}
                        {(selectedAptDetail.customer?.phone || data?.phone) &&
                          ` (${selectedAptDetail.customer?.phone || data?.phone})`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested Services */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <span className="material-symbols-outlined text-sm text-blue-600">build_circle</span>
                    <span>Dịch vụ yêu cầu ({aptServices.length})</span>
                  </div>
                </div>
                {aptServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aptServices.map((svc) => (
                      <span
                        key={svc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px] text-blue-600">check_circle</span>
                        {svc.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    Chưa chọn dịch vụ cụ thể — Cố vấn kỹ thuật sẽ kiểm tra theo mô tả tình trạng xe.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span className="material-symbols-outlined text-sm text-blue-600">notes</span>
                  <span>Ghi chú / Tình trạng xe</span>
                </div>
                <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {(() => {
                    const raw = selectedAptDetail.notes?.trim() || '';
                    if (!raw) return 'Không có ghi chú thêm.';
                    if (!raw.includes('[ĐẶT LỊCH BẢO HÀNH]') && !raw.includes('[TIẾP NHẬN BẢO HÀNH')) {
                      return raw;
                    }
                    const lines = raw
                      .split(/\r?\n/)
                      .map((l) => l.trim())
                      .filter(
                        (l) =>
                          l &&
                          !/^\[ĐẶT LỊCH BẢO HÀNH\]$/i.test(l) &&
                          !/^\[TIẾP NHẬN BẢO HÀNH[^\]]*\]/i.test(l) &&
                          !/^Hạng mục bảo hành yêu cầu:/i.test(l) &&
                          !/^Phiếu dịch vụ gốc:/i.test(l) &&
                          !/^Minh chứng hiện (?:trường|trạng):/i.test(l)
                      )
                      .map((l) => l.replace(/^Hiện tượng sự cố(?: thực tế)?:\s*/i, '').trim())
                      .filter(Boolean);
                    return lines.length > 0 ? Array.from(new Set(lines)).join('\n') : 'Không có ghi chú thêm.';
                  })()}
                </p>
              </div>

              {/* Actions: Reschedule / Cancel / Close */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {selectedAptDetail.status === 'REQUESTED' || selectedAptDetail.status === 'RESCHEDULED' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleApt(selectedAptDetail);
                        setRescheduleDate(rawDate);
                        setRescheduleTime(selectedAptDetail.scheduled_time_str || '08:30');
                        setSelectedAptDetail(null);
                      }}
                      className="min-h-[44px] px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
                      className="min-h-[44px] px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
                  className="min-h-[44px] px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors self-end sm:self-auto cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Dời lịch hẹn #${rescheduleApt.id}`}
          onClick={() => {
            if (!aptActionLoading) setRescheduleApt(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cw-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 cw-modal-panel"
          >
            <h3 className="font-bold text-slate-900 text-sm">Dời lịch hẹn #{rescheduleApt.id}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Chọn ngày mới</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  disabled={aptActionLoading}
                  className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Chọn giờ mới</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  disabled={aptActionLoading}
                  className="w-full min-h-[44px] px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={aptActionLoading}
                onClick={() => setRescheduleApt(null)}
                className="min-h-[44px] px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={aptActionLoading}
                onClick={handleConfirmRescheduleApt}
                className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {aptActionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {aptActionLoading ? 'Đang xử lý...' : 'Xác nhận dời lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      {cancelApt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Hủy lịch hẹn #${cancelApt.id}`}
          onClick={() => {
            if (!aptActionLoading) setCancelApt(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cw-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 cw-modal-panel"
          >
            <h3 className="font-bold text-slate-900 text-sm">Hủy lịch hẹn #{cancelApt.id}</h3>
            <p className="text-xs text-slate-500">Vui lòng cho biết lý do hủy lịch:</p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={aptActionLoading}
              placeholder="Tôi bận việc đột xuất..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={aptActionLoading}
                onClick={() => setCancelApt(null)}
                className="min-h-[44px] px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium disabled:opacity-50 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={aptActionLoading}
                onClick={handleConfirmCancelApt}
                className="min-h-[44px] px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {aptActionLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {aptActionLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Add/Edit Modal (In Child Panel) */}
      {vehicleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={vehicleModalMode === 'add' ? 'Thêm phương tiện mới' : 'Chỉnh sửa thông tin xe'}
          onClick={() => {
            if (!vehicleActionLoading) setVehicleModalOpen(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cw-modal-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 cw-modal-panel"
          >
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
                aria-label="Đóng biểu mẫu xe"
                className="min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">
                  Biển số xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleForm.licensePlate}
                  onChange={(e) => handleVehicleInputChange('licensePlate', e.target.value.toUpperCase())}
                  disabled={vehicleModalMode === 'edit'}
                  aria-invalid={Boolean(vehicleErrors.licensePlate)}
                  placeholder="Ví dụ: 51G-123.45"
                  className={`w-full px-3 py-2 rounded-xl border font-mono tracking-wider text-sm focus:outline-none focus:ring-2 ${vehicleModalMode === 'edit'
                      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                      : vehicleErrors.licensePlate
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 bg-white focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                />
                {vehicleErrors.licensePlate && (
                  <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    <span>{vehicleErrors.licensePlate}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">
                    Hãng xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.make}
                    onChange={(e) => handleVehicleInputChange('make', e.target.value)}
                    aria-invalid={Boolean(vehicleErrors.make)}
                    placeholder="Toyota, Honda, Ford..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${vehicleErrors.make
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                  />
                  {vehicleErrors.make && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      <span>{vehicleErrors.make}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">
                    Dòng xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) => handleVehicleInputChange('model', e.target.value)}
                    aria-invalid={Boolean(vehicleErrors.model)}
                    placeholder="Santa Fe, Everest, Vios..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${vehicleErrors.model
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                  />
                  {vehicleErrors.model && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      <span>{vehicleErrors.model}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Năm sản xuất</label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    value={vehicleForm.year}
                    onChange={(e) => handleVehicleInputChange('year', e.target.value)}
                    aria-invalid={Boolean(vehicleErrors.year)}
                    placeholder="2022"
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${vehicleErrors.year
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                  />
                  {vehicleErrors.year && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      <span>{vehicleErrors.year}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Màu sơn</label>
                  <input
                    type="text"
                    value={vehicleForm.color}
                    onChange={(e) => handleVehicleInputChange('color', e.target.value)}
                    aria-invalid={Boolean(vehicleErrors.color)}
                    placeholder="Trắng, Đen, Xanh..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${vehicleErrors.color
                        ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                  />
                  {vehicleErrors.color && (
                    <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      <span>{vehicleErrors.color}</span>
                    </p>
                  )}
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
                  disabled={vehicleActionLoading}
                  className="min-h-[44px] px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={vehicleActionLoading}
                  className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
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

      {/* Delete / Deactivate Vehicle Confirm Modal */}
      {vehicleDeleteConfirm && (
        <ConfirmModal
          isOpen={!!vehicleDeleteConfirm}
          title={vehicleDeleteConfirm.hasTransactions ? 'Xác nhận vô hiệu hóa xe' : 'Xác nhận xóa xe'}
          message={
            vehicleDeleteConfirm.hasTransactions
              ? `Phương tiện biển số ${vehicleDeleteConfirm.licensePlate} (${vehicleDeleteConfirm.make} ${vehicleDeleteConfirm.model}) đã phát sinh giao dịch nên không thể xóa vĩnh viễn. Bạn có muốn vô hiệu hóa xe này không? (Bạn có thể kích hoạt lại bất cứ lúc nào)`
              : `Bạn có chắc chắn muốn xóa phương tiện biển số ${vehicleDeleteConfirm.licensePlate} (${vehicleDeleteConfirm.make} ${vehicleDeleteConfirm.model}) khỏi danh sách xe của bạn không?`
          }
          confirmText="Xác nhận"
          onConfirm={handleDeleteVehicle}
          onCancel={() => setVehicleDeleteConfirm(null)}
        />
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
