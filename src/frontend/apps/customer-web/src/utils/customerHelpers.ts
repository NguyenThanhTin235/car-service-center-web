export const MORNING_BOOKING_SLOTS: readonly string[] = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];
export const AFTERNOON_BOOKING_SLOTS: readonly string[] = ['13:30', '14:00', '14:30', '15:00', '16:00'];
export const ALL_BOOKING_SLOTS: readonly string[] = [...MORNING_BOOKING_SLOTS, ...AFTERNOON_BOOKING_SLOTS];

/**
 * Check whether a HH:mm booking slot on `dateObj` is earlier than `now`.
 */
export function isBookingSlotInPast(
  dateObj: Date,
  slot: string,
  now: Date = new Date()
): boolean {
  const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  return new Date(`${dateStr}T${slot}:00`) < now;
}

/**
 * Trigger a browser file download for a PDF blob response and revoke the object URL.
 */
export function downloadPdfBlob(blobData: BlobPart, filename: string): void {
  const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Parse a check-in complaint payload (JSON `{ tags, notes }` or plain text) into structured parts.
 */
export function parseComplaintData(raw?: string | null): { tags: string[]; notes: string } {
  if (!raw) return { tags: [], notes: '' };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const tags: string[] = Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
        : [];
      const notes = typeof parsed.notes === 'string' ? parsed.notes.trim() : '';
      return { tags, notes };
    }
  } catch {
    // Plain text fallback
  }
  const clean = String(raw).trim();
  if (!clean || clean === '{}' || clean === '[]') {
    return { tags: [], notes: '' };
  }
  return { tags: [], notes: clean };
}

/**
 * Format a check-in complaint payload into a single human-readable string.
 */
export function parseComplaintText(raw?: string | null, fallback = ''): string {
  const { tags, notes } = parseComplaintData(raw);
  const parts: string[] = [];
  if (tags.length > 0) parts.push(tags.join(', '));
  if (notes) parts.push(notes);
  return parts.length > 0 ? parts.join(' - ') : fallback;
}

/**
 * Extract readable text from a field that may be a JSON string, object (`notes`/`text`/`items`), or array.
 */
export function parseSafeText(raw?: string | null, fallback = 'Bàn giao đầy đủ'): string {
  if (!raw || !raw.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed.trim() || fallback;
    if (Array.isArray(parsed)) return parsed.join(', ') || fallback;
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.notes) return String(parsed.notes).trim() || fallback;
      if (parsed.text) return String(parsed.text).trim() || fallback;
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items.join(', ');
      }
    }
  } catch {
    // Plain text fallback
  }
  return String(raw).trim() || fallback;
}

/**
 * Format a numeric VND amount using Vietnamese locale grouping.
 */
export function formatVnd(value?: string | number | null, suffix = ' đ'): string {
  if (value === null || value === undefined || value === '') return `0${suffix}`;
  const num = Number(value);
  if (!Number.isFinite(num)) return `0${suffix}`;
  return `${num.toLocaleString('vi-VN')}${suffix}`;
}

const FUEL_LEVEL_LABELS: Record<string, string> = {
  EMPTY: 'Bình rỗng (E)',
  QUARTER: '1/4 bình',
  ONE_QUARTER: '1/4 bình',
  HALF: '1/2 bình',
  THREE_QUARTER: '3/4 bình',
  THREE_QUARTERS: '3/4 bình',
  FULL: 'Đầy bình (F)',
};

/**
 * Translate raw fuel-level enum codes into Vietnamese labels.
 */
export function formatFuelLevel(level?: string | null, fallback = 'Theo xe'): string {
  if (!level) return fallback;
  const key = level.trim().toUpperCase();
  return FUEL_LEVEL_LABELS[key] || level;
}

const VEHICLE_SIZE_LABELS: Record<string, string> = {
  SMALL: 'Nhỏ',
  MEDIUM: 'Trung bình',
  LARGE: 'Lớn',
  SUV: 'SUV / Crossover',
  TRUCK: 'Bán tải',
  XL: 'Cỡ lớn',
};

/**
 * Translate raw vehicle-size enum codes into Vietnamese labels.
 */
export function formatVehicleSize(size?: string | null, fallback = 'Tiêu chuẩn'): string {
  if (!size) return fallback;
  const key = size.trim().toUpperCase();
  return VEHICLE_SIZE_LABELS[key] || size;
}
