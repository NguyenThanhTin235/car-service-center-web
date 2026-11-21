export function resolveProfileHref(roles: string[] = []): string {
  const normalizedRoles = roles.map((r) =>
    r.toUpperCase().trim().replace(/[\s-]+/g, '_')
  );

  if (normalizedRoles.some((r) => ['ADMIN', 'ADMINISTRATOR'].includes(r))) {
    return '/admin/profile';
  }
  if (normalizedRoles.includes('MANAGER')) {
    return '/manager/profile';
  }
  if (normalizedRoles.some((r) => ['SA', 'ADVISOR', 'SERVICE_ADVISOR'].includes(r))) {
    return '/advisor/profile';
  }
  return '/staff/profile';
}

export function formatRoleLabelVi(roleStr?: string): string {
  if (!roleStr) return 'Nhân viên nội bộ';
  const r = roleStr.toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'Quản trị viên';
  if (r === 'MANAGER') return 'Quản lý xưởng';
  if (r === 'SA' || r === 'ADVISOR' || r === 'SERVICE_ADVISOR') return 'Cố vấn dịch vụ';
  if (r === 'DESK_STAFF' || r === 'DESKSTAFF' || r === 'FRONT_DESK' || r === 'STAFF') {
    return 'Nhân viên lễ tân';
  }
  if (r === 'TECHNICIAN') return 'Kỹ thuật viên';
  if (r === 'QC_STAFF') return 'Nhân viên KCS';
  if (r === 'CASHIER') return 'Thu ngân';
  return roleStr;
}

const POSITION_LABELS: Record<string, string> = {
  TECHNICIAN: 'Kỹ thuật viên sửa chữa',
  DETAILER: 'Kỹ thuật viên chăm sóc xe',
  QC_STAFF: 'Nhân viên kiểm định chất lượng (QC)',
  ADVISOR: 'Cố vấn dịch vụ (SA)',
  OTHER: 'Nhân sự vận hành khác',
};

export function formatPositionLabelVi(position?: string | null): string {
  if (!position) return 'Chưa phân vị trí';
  return POSITION_LABELS[position.toUpperCase()] || position;
}

export function formatEmployeeCode(employeeId?: number | null): string {
  if (!employeeId) return '—';
  return `EMP-${String(employeeId).padStart(4, '0')}`;
}

export function formatDateVi(dateInput?: string | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getInitials(fullName?: string | null, fallback = 'NV'): string {
  const clean = (fullName || '').trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || fallback
  );
}

export const VN_PHONE_REGEX = /^(0|\+84)[3-9]\d{8}$/;
