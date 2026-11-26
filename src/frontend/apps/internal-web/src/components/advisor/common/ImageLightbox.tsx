'use client';

import React from 'react';
import ModalPortal from './ModalPortal';

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  ariaLabel?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt = 'Ảnh phóng to',
  ariaLabel = 'Xem phóng to hình ảnh',
  onClose,
}: ImageLightboxProps) {
  if (!src) return null;

  return (
    <ModalPortal onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-zoom-out p-4 sa-modal-backdrop"
        onClick={onClose}
      >
        <button
          type="button"
          aria-label="Đóng xem ảnh"
          className="sa-press absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          className="sa-modal-panel max-w-[94vw] max-h-[92dvh] object-contain shadow-2xl rounded-xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </ModalPortal>
  );
}
