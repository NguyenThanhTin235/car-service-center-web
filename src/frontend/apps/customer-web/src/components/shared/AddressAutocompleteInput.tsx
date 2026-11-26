'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  hasError?: boolean;
  className?: string;
  placeholder?: string;
}

const VN_COMMON_LOCATIONS = [
  'Quận 1, TP. Hồ Chí Minh',
  'Quận 3, TP. Hồ Chí Minh',
  'Quận 5, TP. Hồ Chí Minh',
  'Quận 7, TP. Hồ Chí Minh',
  'Quận 10, TP. Hồ Chí Minh',
  'Quận Bình Thạnh, TP. Hồ Chí Minh',
  'Quận Gò Vấp, TP. Hồ Chí Minh',
  'Quận Phú Nhuận, TP. Hồ Chí Minh',
  'Quận Tân Bình, TP. Hồ Chí Minh',
  'Quận Tân Phú, TP. Hồ Chí Minh',
  'TP. Thủ Đức, TP. Hồ Chí Minh',
  'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
  'Quận Hoàn Kiếm, Hà Nội',
  'Quận Cầu Giấy, Hà Nội',
  'Quận Đống Đa, Hà Nội',
  'Quận Hai Bà Trưng, Hà Nội',
  'Quận Thanh Xuân, Hà Nội',
  'Quận Hải Châu, Đà Nẵng',
  'TP. Biên Hòa, Đồng Nai',
  'TP. Thủ Dầu Một, Bình Dương',
  'TP. Dĩ An, Bình Dương',
  'Quận Ninh Kiều, Cần Thơ',
];

function stripAccents(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onBlur,
  readOnly = false,
  hasError = false,
  className = '',
  placeholder = 'Nhập địa chỉ của bạn',
}: AddressAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const localSuggestions = useMemo(() => {
    const q = stripAccents(value.trim());
    if (q.length < 2) return [];
    return VN_COMMON_LOCATIONS.filter((loc) => stripAccents(loc).includes(q)).slice(0, 4);
  }, [value]);

  const suggestions = useMemo(() => {
    const merged = [...remoteSuggestions];
    for (const loc of localSuggestions) {
      if (!merged.some((item) => item.toLowerCase() === loc.toLowerCase())) {
        merged.push(loc);
      }
    }
    return merged.slice(0, 6);
  }, [remoteSuggestions, localSuggestions]);

  useEffect(() => {
    if (readOnly || !open) return;
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setRemoteSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          format: 'json',
          addressdetails: '1',
          countrycodes: 'vn',
          limit: '5',
          'accept-language': 'vi',
          q: trimmed,
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ display_name?: string }>;
        if (!controller.signal.aborted && Array.isArray(data)) {
          const formatted = data
            .map((item) =>
              (item.display_name || '')
                .replace(/,\s*Việt Nam$/i, '')
                .trim()
            )
            .filter(Boolean);
          setRemoteSuggestions(Array.from(new Set(formatted)));
        }
      } catch {
        // Fallback silently to local suggestions if offline or aborted
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, open, readOnly]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleSelect = (selected: string) => {
    onChange(selected);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly || !open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = !readOnly && open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <span
        className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px] pointer-events-none"
        aria-hidden="true"
      >
        location_on
      </span>
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-invalid={hasError}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`${className} pl-10 ${loading ? 'pr-9' : ''}`}
        onFocus={() => {
          if (!readOnly && value.trim().length >= 2) setOpen(true);
        }}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          if (!readOnly) {
            setOpen(next.trim().length >= 2);
            setActiveIndex(-1);
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
          onBlur?.();
        }}
      />
      {loading && !readOnly && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin pointer-events-none"
          aria-hidden="true"
        />
      )}

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {suggestions.map((suggestion, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li key={suggestion} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-start gap-2.5 transition-colors cursor-pointer ${
                    isActive ? 'bg-blue-50 text-accent font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    location_on
                  </span>
                  <span className="leading-snug">{suggestion}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
