---
name: AutoCare Pro — Automotive Concierge Editorial
description: Hệ thống thiết kế sáng sạch, đồng bộ sắc xanh Royal Sapphire với cổng vận hành nội bộ AutoCare Pro.
colors:
  canvas: "#F6F8FC"
  surface-elevated: "#FFFFFF"
  surface-subtle: "#F1F5F9"
  surface-muted: "#E2E8F0"
  stone-dim: "#CBD5E1"
  ink-primary: "#0F172A"
  ink-secondary: "#475569"
  ink-muted: "#64748B"
  accent: "#0050CD"
  accent-hover: "#0043AD"
  accent-navy: "#091D3E"
  accent-bright: "#0866FF"
  accent-soft: "#DBEAFE"
  accent-ink: "#1E3A8A"
  selection-bg: "#BFDBFE"
  inverse-accent: "#93C5FD"
  print-black: "#000000"
  bronze: "#B45309"
  bronze-ink: "#78350F"
  bronze-deep: "#451A03"
  bronze-soft: "#FEF3C7"
  bronze-dim: "#FCD34D"
  status-success: "#0E7C47"
  status-success-soft: "#E3F3EA"
  status-warning: "#B45309"
  status-warning-soft: "#FEF2DF"
  status-danger: "#B91C1C"
  status-danger-soft: "#FDE8E8"
  status-info: "#1D5B8C"
  status-info-soft: "#E5F0F8"
typography:
  display:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.28
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.02em"
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
  icon:
    fontFamily: "Material Symbols Outlined"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface-elevated}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "44px"
  card-elevated:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-subtle:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
    height: "44px"
  badge-status:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  license-plate:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: AutoCare Pro — Automotive Concierge Editorial

## Overview

**Creative North Star: "The Concierge Showroom"**

Hệ thống giao diện của AutoCare Pro mang lại cảm giác của một phòng tiếp đón dịch vụ ô tô cao cấp đồng bộ thương hiệu với cổng nội bộ: nền trắng xám dịu mắt (Soft Cloud `#F6F8FC`), chữ than xám đậm sắc nét (Deep Slate `#0F172A`), sắc xanh dương chuẩn hãng (Royal Sapphire `#0050CD`) và phân cấp không gian bằng sắc độ bề mặt.

Hiệu chuẩn **Taste Skill 3 Dials**:
- **Customer Portal (`/customer/*` — Operate Mode):** `DESIGN_VARIANCE: 6` | `VISUAL_DENSITY: 4` | `MOTION_INTENSITY: 4` — ưu tiên khả năng quét thông tin nhanh, thao tác một tay trên di động và độ tin cậy cao của dữ liệu.
- **Public Landing & Auth (`/home`, `/(auth)/*` — Persuade Mode):** `DESIGN_VARIANCE: 7` | `VISUAL_DENSITY: 3` | `MOTION_INTENSITY: 5` — nhịp điệu biên tập bất đối xứng, bằng chứng dịch vụ thật và điểm chạm đăng nhập gọn gàng.

**Key Characteristics:**
- Bảng màu sáng sạch, đồng nhất sắc xanh `#0050CD` với hệ thống `internal-web`.
- Phân tách thông tin bằng lớp sắc độ tone-on-tone và đường viền mảnh (`hairline`), không lạm dụng bóng đổ.
- Dữ liệu kỹ thuật và tài chính sử dụng `JetBrains Mono` thẳng hàng (`tabular-nums`).
- Thao tác ngón cái tự nhiên trên di động (`390px`) và cấu trúc đa cột cân bằng trên màn hình lớn (`1440px`).

## Colors

Bảng màu tiết chế, ưu tiên độ tương phản văn bản cao và chỉ dùng màu nhấn cho trạng thái hoặc hành động quan trọng.

### Primary
- **Royal Sapphire Blue** (`colors.accent` `#0050CD`): Dùng cho nút hành động chính, mục điều hướng đang chọn và điểm nhấn nhận diện thương hiệu đồng bộ với `internal-web`.
- **Deep Sapphire Hover** (`colors.accent-hover` `#0043AD`): Dùng khi di chuột hoặc nhấn giữ trên nút hành động chính.
- **Ice Blue Soft Tint** (`colors.accent-soft` `#DBEAFE`): Nền nhẹ cho mục đang hoạt động trong thanh điều hướng và huy hiệu nhận diện.

### Secondary
- **Warm Amber** (`colors.bronze` `#B45309`): Dùng có tiết chế cho trạng thái chờ phê duyệt báo giá, điểm nhấn hạng mục nổi bật hoặc thông tin ưu tiên cao.
- **Amber Soft Tint** (`colors.bronze-soft` `#FEF3C7`): Nền nhãn cảnh báo mềm hoặc huy hiệu cần chú ý.

### Neutral
- **Soft Cloud Canvas** (`colors.canvas` `#F6F8FC`): Nền tổng thể của toàn ứng dụng.
- **Pure White** (`colors.surface-elevated` `#FFFFFF`): Thẻ nội dung chính, thanh điều hướng, modal và khu vực hiển thị mã VietQR.
- **Cool Slate Mist** (`colors.surface-subtle` `#F1F5F9`): Vùng lồng (inset), bộ lọc trạng thái và thẻ tóm tắt phụ.
- **Slate Muted** (`colors.surface-muted` `#E2E8F0`): Nền khung chờ tải (skeleton) và đường phân cách phụ.
- **Deep Slate Ink** (`colors.ink-primary` `#0F172A`): Tiêu đề, biển số xe, số tiền và nội dung chính (độ tương phản > 15:1 trên nền trắng).
- **Slate Charcoal** (`colors.ink-secondary` `#475569`): Mô tả phụ, tên cố vấn/kỹ thuật viên, nhãn giải thích.
- **Slate Stone** (`colors.ink-muted` `#64748B`): Mốc thời gian, ghi chú gợi ý, trạng thái chờ (đạt >= 4.5:1 trên nền trắng).

### Named Rules
**The Quiet Accent Rule.** Màu nhấn chính (`accent`) chiếm tối đa 10% diện tích màn hình để mọi nút hành động và trạng thái đang diễn ra nổi bật tức thì.

**The Semantic Status Rule.** Các màu trạng thái (`status-success`, `status-warning`, `status-danger`, `status-info`) chỉ dùng cho tiến độ sửa chữa, kết quả QC, trạng thái hóa đơn và cảnh báo hệ thống — không dùng làm màu trang trí.

## Typography

**Display & Body Font:** `Be Vietnam Pro` (kèm fallback `system-ui, sans-serif`)  
**Technical & Financial Mono Font:** `JetBrains Mono` (kèm fallback `ui-monospace, monospace`)

**Character:** Cặp đôi giữa nét chữ hình học thân thiện, hỗ trợ dấu tiếng Việt sắc nét của `Be Vietnam Pro` và sự chuẩn xác tuyệt đối của `JetBrains Mono` cho thông số kỹ thuật và hóa đơn.

### Hierarchy
- **Display** (`700`, `2.25rem`, `line-height: 1.2`, `letter-spacing: -0.025em`): Tiêu đề trang chủ và các khối giới thiệu nổi bật.
- **Headline** (`700`, `1.75rem`, `line-height: 1.28`, `letter-spacing: -0.025em`): Tiêu đề chính của từng trang trong cổng khách hàng (`h1`).
- **Title** (`600`, `1.125rem`, `line-height: 1.35`, `letter-spacing: -0.015em`): Tiêu đề thẻ nội dung, tiêu đề modal và phân nhóm chức năng.
- **Body** (`400`, `0.9375rem`, `line-height: 1.6`, giới hạn `65–75ch`): Văn bản mô tả, ghi chú cố vấn dịch vụ và nội dung thông báo.
- **Label** (`600`, `0.75rem`, `line-height: 1.33`, `letter-spacing: 0.02em`): Nhãn nút bấm, huy hiệu trạng thái và thanh điều hướng.
- **Mono** (`600`, `0.875rem`, `font-variant-numeric: tabular-nums`): Biển số xe, mã lệnh sửa chữa (`WO-...`), số hóa đơn, số tiền VND, số km (ODO) và mốc giờ.

### Named Rules
**The Honest Heading Rule.** Không đặt nhãn phụ nhỏ (kicker/eyebrow) phía trên tiêu đề chính; bản thân tiêu đề phải đủ rõ ràng và tự đứng vững.

**The Tabular Integrity Rule.** Mọi giá trị tiền tệ, biển số, mã chứng từ và cột số liệu bắt buộc dùng `tabular-nums` để căn thẳng hàng dọc.

## Layout

Hệ thống lưới đáp ứng linh hoạt qua 4 điểm gãy chuẩn:
- **Mobile (`390px` – `<768px`):** Đệm ngang `16px`, thanh đầu trang gọn `56px` và **Thanh điều hướng đáy 5 mục cốt lõi** (`Tổng quan`, `Tiến độ xe`, `Đặt lịch`, `Hóa đơn`, `Hồ sơ`) cao tối thiểu `56px` có khoảng trống `safe-area-inset-bottom`. Bố cục 1 cột dọc, vùng chạm tối thiểu `44×44px`.
- **Tablet (`768px` – `<1024px`):** Đệm ngang `24px`, thanh đầu trang `64px` kèm ngăn kéo điều hướng trượt ngang, bố cục lưới 2 cột hoặc Bento 7/5.
- **Laptop & Desktop (`1024px` – `1440px+`):** Thanh điều hướng trái cố định rộng `256px` (`w-64`), thanh ngữ cảnh trên cùng `64px`, vùng nội dung tối đa `1320px` với đệm `32px`. Tách biệt hoàn toàn khỏi đầu trang Landing Page công khai.
- **Print (`@media print`):** Ẩn toàn bộ thanh điều hướng, nút bấm và khung phụ để xuất hóa đơn khổ A4 sạch sẽ.

## Elevation & Depth

Hệ thống tạo chiều sâu bằng **Tone-on-Tone Layering** (nền Alabaster → thẻ Ivory → vùng lồng Warm Stone) thay vì dùng bóng đổ nặng.

### Named Rules
**The Single-Declaration Depth Rule.** Mỗi bề mặt chỉ khai báo độ nổi một lần duy nhất: dùng đường viền mảnh (`1px solid rgba(20, 22, 25, 0.08)`) cho thẻ tĩnh trên nền, HOẶC dùng bóng đổ mềm (`0 20px 50px rgba(20, 22, 25, 0.16)`) cho lớp phủ nổi như Modal / Bottom Sheet — tuyệt đối không kết hợp cả viền lẫn bóng đổ lớn trên cùng một thẻ.

## Shapes

Ngôn ngữ hình khối gọn gàng, chính xác như chi tiết cơ khí cao cấp:
- **Thẻ nội dung & Hộp thoại:** Bo góc `16px` (`rounded-2xl`); trên di động, hộp thoại chuyển thành Bottom Sheet bo `16px` hai góc trên (`rounded-t-2xl`).
- **Nút bấm & Ô nhập liệu:** Bo góc `10px–12px` (`rounded-xl`), chiều cao tối thiểu `44px`.
- **Biển số xe kỹ thuật:** Bo góc `6px` (`rounded-md`) mô phỏng tem/biển kiểm soát sắc nét.
- **Huy hiệu trạng thái & Bộ lọc nhỏ:** Bo tròn hoàn toàn (`9999px` / `rounded-full`).

## Components

### Buttons
- **Primary:** Nền `colors.accent`, chữ trắng, bo `12px`, cao tối thiểu `44px`, phản hồi nhấn `active:scale-[0.98]` trong `150ms`.
- **Secondary:** Nền `colors.surface-subtle`, chữ `colors.ink-primary`, bo `12px`, cao tối thiểu `44px`.
- **Ghost:** Nền trong suốt, chuyển sang `colors.surface-subtle` khi hover.

### Cards / Containers
- **Elevated Card:** Nền `colors.surface-elevated`, viền mảnh `rgba(20, 22, 25, 0.08)`, bo `16px`, không bóng đổ.
- **Subtle Inset Card:** Nền `colors.surface-subtle`, không viền, bo `16px`, dùng để gom thông số phụ bên trong trang (không lồng thẻ có viền vào nhau).

### Inputs / Fields
- **Style:** Cao tối thiểu `44px`, nền `colors.surface-elevated`, viền mảnh `rgba(20, 22, 25, 0.14)`, bo `12px`.
- **Focus:** Viền chuyển sang `colors.accent` kèm vòng focus `2px` rõ nét (`:focus-visible`).

### Navigation
- **Desktop Sidebar:** Mục đang chọn dùng nền `colors.accent-soft` và chữ `colors.accent` đậm, icon dạng filled; tuyệt đối không dùng đường kẻ dọc dày bên trái.
- **Mobile Bottom Bar:** 5 mục cốt lõi, nhãn ngắn 1–2 từ, chiều cao `56px` + safe area.

### Signature Component: `LicensePlateTag`
- Thẻ hiển thị biển số xe dùng `JetBrains Mono` viết hoa, `tabular-nums`, khoảng chữ rộng `0.04em`, nền trắng và viền mảnh sắc nét để chủ xe nhận diện ngay chiếc xe của mình.

## Do's and Don'ts

### Do:
- **Do** sử dụng `font-mono tabular-nums` cho mọi biển số xe, mã WO, hóa đơn, số tiền VND và số km.
- **Do** giữ vùng chạm tối thiểu `44×44px` trên di động và chuyển modal phức tạp thành Bottom Sheet.
- **Do** cài đặt đủ 4 trạng thái (Loading Skeleton, Empty State kèm CTA tiếng Việt, Error kèm nút Thử lại, Data) cho mọi khối tải dữ liệu bất đồng bộ.
- **Do** tạo chiều sâu bằng lớp màu `canvas` → `surface-elevated` → `surface-subtle`.

### Don't:
- **Don't** đặt nhãn phụ nhỏ (kicker/eyebrow) phía trên tiêu đề chính.
- **Don't** kết hợp cả đường viền lẫn bóng đổ lớn trên cùng một thẻ (Ghost Card).
- **Don't** dùng vạch màu dày bên trái (`border-left > 1px`) trên thẻ thông báo hay mục menu.
- **Don't** dùng gradient xanh/tím, quả cầu phát sáng, icon xoay liên tục (`animate-spin` trên icon tĩnh) hay emoji thay cho hệ thống icon `Material Symbols Outlined`.
- **Don't** dùng `font-mono` cho tiêu đề hay đoạn văn bản thông thường như một kiểu trang trí.
