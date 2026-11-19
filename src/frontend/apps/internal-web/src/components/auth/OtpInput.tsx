'use client';

import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
}

export default function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const newValue = [...value];
    newValue[index] = digit;
    onChange(newValue);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const newValue = [...value];
        newValue[index - 1] = '';
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const newValue = [...value];
    for (let i = 0; i < pasted.length; i++) {
      newValue[i] = pasted[i];
    }
    onChange(newValue);
    const lastIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          aria-label={`Mã OTP chữ số thứ ${i + 1}`}
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center font-mono tabular-nums text-xl sm:text-2xl font-bold rounded-xl border-2 transition-colors outline-none bg-white text-slate-900 ${
            value[i]
              ? 'border-[#0050cd] bg-blue-50/70'
              : 'border-slate-200 hover:border-slate-300'
          } focus:border-[#0050cd] focus:ring-2 focus:ring-[#0050cd]/20 disabled:bg-slate-100 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}
