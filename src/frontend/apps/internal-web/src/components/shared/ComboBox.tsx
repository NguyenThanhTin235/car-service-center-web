import React, { useState, useRef, useEffect } from 'react';

export interface ComboBoxOption {
  id: number | string;
  label: string;
}

interface Props {
  options: ComboBoxOption[];
  value: number | string;
  onChange: (val: number | string) => void;
  placeholder?: string;
}

export default function ComboBox({ options, value, onChange, placeholder }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find(o => o.id === value);
    if (selected && !isOpen) {
      setSearch(selected.label);
    } else if (!value) {
      setSearch('');
    }
  }, [value, options, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selected = options.find(o => o.id === value);
        if (selected) {
          setSearch(selected.label);
        } else {
          setSearch('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full h-10 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0866ff] focus:ring-1 focus:ring-[#0866ff]/20 transition-all"
        placeholder={placeholder}
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearch('');
        }}
      />
      {isOpen && (
        <ul className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200/90 rounded-xl shadow-lg max-h-52 overflow-auto styled-scrollbar p-1">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <li
                key={opt.id}
                className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0866ff] transition-colors"
                onClick={() => {
                  onChange(opt.id);
                  setSearch(opt.label);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-xs text-slate-400 italic">Không tìm thấy kết quả phù hợp</li>
          )}
        </ul>
      )}
    </div>
  );
}
