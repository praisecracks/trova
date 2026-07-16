import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, type CountryOption } from '../lib/data/countries';

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0d0d0f] border border-[#27272a] rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer flex items-center gap-2 min-w-[120px]"
      >
        <img
          src={`https://flagcdn.com/w20/${selected.iso}.png`}
          alt={selected.name}
          className="w-5 h-3.5 object-cover rounded-sm"
          loading="eager"
        />
        <span className="text-zinc-300 font-medium">{selected.code}</span>
        <span className="text-zinc-500 ml-auto">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 w-64 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-[#27272a]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-[#0d0d0f] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto no-scrollbar">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  c.code === value
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <img
                  src={`https://flagcdn.com/w20/${c.iso}.png`}
                  alt={c.name}
                  className="w-5 h-3.5 object-cover rounded-sm"
                  loading="lazy"
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-zinc-500 text-[10px]">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
