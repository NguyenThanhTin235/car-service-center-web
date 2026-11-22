import React, { useState, useRef, useEffect } from 'react';

export interface ComboBoxOption {
  id: number | string;
  label: string;
  subLabel?: string;
}

interface Props {
  options: ComboBoxOption[];
  value: number | string;
  onChange: (val: number | string) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function ComboBox({
  options,
  value,
  onChange,
  placeholder = 'Chọn hoặc nhập để tìm kiếm...',
  allowClear = true,
  className = '',
  disabled = false,
}: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => String(o.id) === String(value));

  useEffect(() => {
    if (!isTyping) {
      setSearch(selectedOption ? selectedOption.label : '');
    }
  }, [value, options, isTyping, selectedOption]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        setSearch(selectedOption ? selectedOption.label : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const filtered = options.filter((o) => {
    if (!isTyping || !search.trim()) return true;
    const q = search.toLowerCase().trim();
    const matchLabel = o.label.toLowerCase().includes(q);
    const matchSub = o.subLabel ? o.subLabel.toLowerCase().includes(q) : false;
    return matchLabel || matchSub;
  });

  const handleSelect = (opt: ComboBoxOption) => {
    onChange(opt.id);
    setSearch(opt.label);
    setIsTyping(false);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setIsTyping(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        className={`relative flex items-center w-full h-10 rounded-xl border transition-all ${
          disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed border-slate-200' : 'bg-white'
        } ${
          isOpen
            ? 'border-[#0866ff] ring-2 ring-[#0866ff]/15'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-slate-400 text-[18px] ml-3 shrink-0 pointer-events-none">
          search
        </span>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          className="w-full h-full pl-2 pr-16 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsTyping(true);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            if (disabled) return;
            setIsOpen(true);
            e.target.select();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setIsTyping(false);
              setSearch(selectedOption ? selectedOption.label : '');
            }
          }}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {allowClear && !disabled && Boolean(value) && (
            <button
              type="button"
              onClick={handleClear}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Xóa lựa chọn"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setIsOpen((prev) => !prev);
              if (!isOpen && inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[19px] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#0866ff]' : ''
              }`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl max-h-56 overflow-y-auto styled-scrollbar p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.length > 0 ? (
            filtered.map((opt) => {
              const isSelected = String(opt.id) === String(value);
              return (
                <li
                  key={String(opt.id)}
                  onClick={() => handleSelect(opt)}
                  className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-[#0866ff] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0866ff]'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[17px] text-[#0866ff] shrink-0">
                      check
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-3 text-xs text-slate-400 italic text-center">
              Không tìm thấy tài khoản phù hợp
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
