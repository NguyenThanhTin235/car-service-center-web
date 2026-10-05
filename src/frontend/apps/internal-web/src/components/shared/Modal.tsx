import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    'md': 'max-w-md',
    'lg': 'max-w-2xl',
    'xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-surface-container-lowest rounded-xl shadow-lg w-full ${sizeClasses[size]} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
