import React, { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const styles: Record<ToastType, string> = {
  success: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]',
  error: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]',
  info: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-[#10b981]',
  error: 'text-[#ef4444]',
  info: 'text-[#3b82f6]',
};

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-slide-up max-w-sm ${styles[type]}`}>
      <span className={`material-symbols-outlined text-lg shrink-0 ${iconStyles[type]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icons[type]}
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}
