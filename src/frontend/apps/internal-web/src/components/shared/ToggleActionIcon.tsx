import React from 'react';

interface ToggleActionIconProps {
  /** Trạng thái hiện tại của bản ghi: true = đang bật (hiển thị icon tắt), false = đang tắt (hiển thị icon bật) */
  isActive: boolean;
}

export default function ToggleActionIcon({ isActive }: ToggleActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="w-[18px] h-[18px]"
    >
      <rect
        x="2.5"
        y="6.5"
        width="19"
        height="11"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle
        cx={isActive ? 8 : 16}
        cy="12"
        r="3"
        fill="currentColor"
      />
    </svg>
  );
}
