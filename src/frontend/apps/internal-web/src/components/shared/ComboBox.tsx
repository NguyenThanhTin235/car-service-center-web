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
        className="w-full px-3 py-2 border border-outline rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-surface-container-lowest"
        placeholder={placeholder}
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearch(''); // Clear to show all options when focused
        }}
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.length > 0 ? filtered.map(opt => (
            <li
              key={opt.id}
              className="px-3 py-2 cursor-pointer hover:bg-surface-container text-body-md"
              onClick={() => {
                onChange(opt.id);
                setSearch(opt.label);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </li>
          )) : (
            <li className="px-3 py-2 text-secondary text-body-sm italic">Không tìm thấy kết quả</li>
          )}
        </ul>
      )}
    </div>
  );
}
