import { useRef } from 'react';
import type React from 'react';

export function useBackdropClose(onClose: () => void, disabled = false) {
  const mouseDownOnBackdropRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      mouseDownOnBackdropRef.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (!disabled && mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
        onCloseRef.current();
      }
      mouseDownOnBackdropRef.current = false;
    },
  };
}
