import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for transition
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getStyle = () => {
    switch (type) {
      case 'error':
        return 'bg-error-container text-on-error-container border-error/20';
      case 'info':
        return 'bg-surface-container-highest text-on-surface border-outline-variant';
      case 'success':
      default:
        return 'bg-secondary-container text-on-secondary-container border-secondary/20';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'success':
      default:
        return 'check_circle';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        } ${getStyle()}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
          {getIcon()}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
