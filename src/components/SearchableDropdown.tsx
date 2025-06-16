import React, { useState, useRef, useEffect } from 'react';

type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function SearchableDropdown({ value, options, onChange, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (filtered[highlight]) handleSelect(filtered[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        className="w-full border rounded px-1 py-0.5"
        value={open ? search : value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        readOnly={false}
        autoComplete="off"
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-auto mt-1">
          {filtered.length === 0 && (
            <div className="px-2 py-1 text-gray-400">No options</div>
          )}
          {filtered.map((opt, i) => (
            <div
              key={opt}
              className={`px-2 py-1 cursor-pointer ${i === highlight ? 'bg-blue-100' : ''}`}
              onMouseDown={() => handleSelect(opt)}
              onMouseEnter={() => setHighlight(i)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 