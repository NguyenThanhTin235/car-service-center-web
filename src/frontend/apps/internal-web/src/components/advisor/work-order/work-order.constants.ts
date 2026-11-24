export interface WorkOrderStatusMeta {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  dot: string;
  dotColor: string;
  pipelineLabel: string;
}

export const WO_STATUS_META: Record<string, WorkOrderStatusMeta> = {
  DRAFT: {
    label: 'Tiếp nhận',
    shortLabel: 'Tiếp nhận',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
    dotColor: '#64748b',
    pipelineLabel: 'Tiếp nhận',
  },
  IN_PLANNING: {
    label: 'Lập kế hoạch',
    shortLabel: 'Kế hoạch',
    bg: 'bg-blue-50',
    text: 'text-[#0050cd]',
    dot: 'bg-[#0050cd]',
    dotColor: '#0050cd',
    pipelineLabel: 'Lập kế hoạch',
  },
  ESTIMATING: {
    label: 'Đang báo giá',
    shortLabel: 'Báo giá',
    bg: 'bg-blue-50',
    text: 'text-[#0050cd]',
    dot: 'bg-[#0050cd]',
    dotColor: '#0050cd',
    pipelineLabel: 'Lập kế hoạch',
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt báo giá',
    shortLabel: 'Chờ duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    dotColor: '#f59e0b',
    pipelineLabel: 'Chờ duyệt',
  },
  WAITING_CUSTOMER: {
    label: 'Chờ khách duyệt',
    shortLabel: 'Chờ duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    dotColor: '#f59e0b',
    pipelineLabel: 'Chờ duyệt',
  },
  APPROVED: {
    label: 'Đã duyệt',
    shortLabel: 'Đã duyệt',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    dotColor: '#6366f1',
    pipelineLabel: 'Đã duyệt',
  },
  IN_PROGRESS: {
    label: 'Đang sửa chữa',
    shortLabel: 'Đang sửa',
    bg: 'bg-blue-50',
    text: 'text-[#0050cd]',
    dot: 'bg-[#0050cd]',
    dotColor: '#0ea5e9',
    pipelineLabel: 'Đang sửa',
  },
  QC_IN_PROGRESS: {
    label: 'Đang kiểm định KCS',
    shortLabel: 'Kiểm định',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    dotColor: '#0ea5e9',
    pipelineLabel: 'Đang sửa',
  },
  BILLING_REQUESTED: {
    label: 'Chờ thanh toán',
    shortLabel: 'Chờ TT',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    dotColor: '#8b5cf6',
    pipelineLabel: 'Chờ thanh toán',
  },
  FINANCIAL_CLEARED: {
    label: 'Chờ giao xe',
    shortLabel: 'Chờ giao',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    dotColor: '#10b981',
    pipelineLabel: 'Chờ giao xe',
  },
  RELEASED: {
    label: 'Đã giao xe',
    shortLabel: 'Đã giao',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    dotColor: '#14b8a6',
    pipelineLabel: 'Đóng',
  },
  CLOSED: {
    label: 'Đã đóng',
    shortLabel: 'Đã đóng',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    dotColor: '#475569',
    pipelineLabel: 'Đóng',
  },
  CANCELLED: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    dotColor: '#e11d48',
    pipelineLabel: 'Đã hủy',
  },
};

export const FUEL_LEVEL_LABELS: Record<string, string> = {
  EMPTY: 'Bình cạn (E)',
  QUARTER: '1/4 bình',
  HALF: '1/2 bình',
  THREE_QUARTER: '3/4 bình',
  FULL: 'Đầy bình (F)',
};

export const FUEL_LEVEL_OPTIONS: { value: string; label: string }[] = Object.entries(
  FUEL_LEVEL_LABELS
).map(([value, label]) => ({ value, label }));

export const VEHICLE_SIZE_LABELS: Record<string, string> = {
  SMALL: 'Cỡ nhỏ',
  MEDIUM: 'Cỡ vừa',
  LARGE: 'Cỡ lớn',
  SUV: 'SUV / Crossover',
  TRUCK: 'Bán tải',
};

export function formatVehicleSize(size?: string | null): string {
  if (!size) return 'N/A';
  return VEHICLE_SIZE_LABELS[size.toUpperCase().trim()] || size;
}

export const STATUS_PIPELINE = [
  'Tiếp nhận',
  'Lập kế hoạch',
  'Chờ duyệt',
  'Đã duyệt',
  'Đang sửa',
  'Chờ thanh toán',
  'Chờ giao xe',
  'Đóng',
] as const;

export const CLOSED_WO_STATUSES = new Set(['CLOSED', 'CANCELLED', 'RELEASED']);
export const POST_QC_WO_STATUSES = new Set([
  'BILLING_REQUESTED',
  'FINANCIAL_CLEARED',
  'RELEASED',
  'CLOSED',
]);

export type InspectionMarkerType = 'DAMAGE' | 'RUST' | 'MISSING' | 'DENT' | 'SCRATCH';

export interface InspectionMarkerMeta {
  type: InspectionMarkerType;
  label: string;
  icon: string;
  hex: string;
  color: string;
  bgColor: string;
  borderColor: string;
  lightBg: string;
}

export const INSPECTION_MARKER_META: Record<InspectionMarkerType, InspectionMarkerMeta> = {
  DAMAGE: {
    type: 'DAMAGE',
    label: 'Hư hỏng / Vỡ',
    icon: 'X',
    hex: '#dc2626',
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-600',
    lightBg: 'bg-red-50',
  },
  RUST: {
    type: 'RUST',
    label: 'Gỉ sét / Ăn mòn',
    icon: 'R',
    hex: '#d97706',
    color: 'text-amber-600',
    bgColor: 'bg-amber-600',
    borderColor: 'border-amber-600',
    lightBg: 'bg-amber-50',
  },
  MISSING: {
    type: 'MISSING',
    label: 'Thiếu phụ tùng',
    icon: 'M',
    hex: '#7c3aed',
    color: 'text-violet-600',
    bgColor: 'bg-violet-600',
    borderColor: 'border-violet-600',
    lightBg: 'bg-violet-50',
  },
  DENT: {
    type: 'DENT',
    label: 'Móp méo',
    icon: 'D',
    hex: '#0284c7',
    color: 'text-sky-600',
    bgColor: 'bg-sky-600',
    borderColor: 'border-sky-600',
    lightBg: 'bg-sky-50',
  },
  SCRATCH: {
    type: 'SCRATCH',
    label: 'Trầy xước',
    icon: 'S',
    hex: '#475569',
    color: 'text-slate-600',
    bgColor: 'bg-slate-600',
    borderColor: 'border-slate-600',
    lightBg: 'bg-slate-100',
  },
};

export const INSPECTION_TOOLS = Object.values(INSPECTION_MARKER_META);
