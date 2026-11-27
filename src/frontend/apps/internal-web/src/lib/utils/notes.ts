/**
 * Chuẩn hóa chuỗi ghi chú bảo hành: loại bỏ các tag/metadata hệ thống
 * (`[ĐẶT LỊCH BẢO HÀNH]`, `[TIẾP NHẬN BẢO HÀNH...]`, `Hạng mục bảo hành yêu cầu:...`,
 * `Phiếu dịch vụ gốc:...`, `Minh chứng hiện trường/trạng:...`) và chỉ giữ lại
 * nội dung ghi chú sự cố thực tế.
 */
export function formatDisplayNotes(rawNotes?: string | null): string {
  if (!rawNotes) return '';
  const trimmed = rawNotes.trim();
  if (!trimmed) return '';

  const isWarrantyFormatted =
    trimmed.includes('[ĐẶT LỊCH BẢO HÀNH]') ||
    trimmed.includes('[TIẾP NHẬN BẢO HÀNH');

  if (!isWarrantyFormatted) {
    return trimmed;
  }

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\[ĐẶT LỊCH BẢO HÀNH\]$/i.test(line)) continue;
    if (/^\[TIẾP NHẬN BẢO HÀNH[^\]]*\](?:\s*Phiếu dịch vụ gốc:.*)?$/i.test(line)) continue;
    if (/^Hạng mục bảo hành yêu cầu:/i.test(line)) continue;
    if (/^Phiếu dịch vụ gốc:/i.test(line)) continue;
    if (/^Minh chứng hiện (?:trường|trạng):/i.test(line)) continue;

    const incidentMatch = line.match(/^Hiện tượng sự cố(?: thực tế)?:\s*(.+)$/i);
    const cleaned = incidentMatch ? incidentMatch[1].trim() : line;
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      lines.push(cleaned);
    }
  }

  return lines.join('\n');
}
