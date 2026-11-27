# DESIGN.md — AutoCare Pro (Car Service Center) Design System

## 1. Visual Direction & 3-Dials Calibration

- **Brand Identity:** AutoCare Pro — Automotive Precision & Concierge Service.
- **Subsystems:**
  - `internal-web` (Admin, Advisor, Staff, Manager): `DESIGN_VARIANCE: 3` | `VISUAL_DENSITY: 8` | `MOTION_INTENSITY: 2`
  - `customer-web` (Tracking, Invoices, Booking, Warranty): `DESIGN_VARIANCE: 6` | `VISUAL_DENSITY: 4` | `MOTION_INTENSITY: 4`
  - `Landing & Auth`: `DESIGN_VARIANCE: 7` | `VISUAL_DENSITY: 3` | `MOTION_INTENSITY: 5`

## 2. Color Palette (Light-First Precision Slate)

| Role | Token | Value |
|---|---|---|
| Canvas | `--color-canvas` / `--background` | `#F6F8FC` |
| Surface Elevated | `--color-surface-elevated` | `#FFFFFF` |
| Surface Subtle | `--color-surface-subtle` | `#F1F5F9` |
| Ink Primary | `--color-ink-primary` | `#0F172A` |
| Ink Secondary | `--color-ink-secondary` | `#475569` |
| Ink Muted (AA >= 4.5:1) | `--color-ink-muted` | `#64748B` |
| Primary / Accent | `--color-accent` / `--color-primary` | `#0050CD` / `#0866FF` |
| Success | `--color-secondary` | `#0E7C47` / `#059669` |
| Warning | `--color-tertiary` | `#B45309` |
| Error | `--color-error` | `#B91C1C` / `#E11D48` |

## 3. Typography & Type Ramp

- **Sans-Serif:** `Be Vietnam Pro` (`vietnamese`, `latin`)
- **Monospace (Tabular Numerals for VND, VIN, Plates, Codes):** `JetBrains Mono` with `font-mono tabular-nums`
- **Documented Type Ramp:**
  `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `20px`, `22px`, `24px`, `28px`, `32px`, `36px`, `40px`, `44px`, `48px`

## 4. Spacing & Radius Scale

- **4px Grid:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`
- **Radius:**
  - Buttons / Badges: `rounded-md` (`6px`) / `rounded-lg` (`8px`)
  - Cards / Modals: `rounded-xl` (`12px`) / `rounded-2xl` (`16px`)
  - Status Pills / Avatars: `rounded-full`

## 5. Accessibility Floor (WCAG 2.2 AA)

- Touch targets on mobile & workshop tablet (`<= 768px`): minimum `44x44px` (`min-w-[44px] min-h-[44px]`).
- Focus indicators: visible `2px` primary ring on `:focus-visible`.
- Modals: `role="dialog"`, `aria-modal="true"`, initial focus, `Tab` focus trap, `Escape` close, focus restoration, and `max-h-[90dvh] overflow-y-auto`.
- Decorative icons: `aria-hidden="true"`.
