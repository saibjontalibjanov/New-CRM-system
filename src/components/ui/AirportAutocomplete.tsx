import React, { useEffect, useId, useRef, useState } from 'react';
import { Plane } from 'lucide-react';
import { findAirportByCode, searchAirports } from '../../data/airports';
import type { Airport } from '../../types/crm';

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  error?: string;
}

export function AirportAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'City or IATA code (e.g. TAS)',
  error,
}: AirportAutocompleteProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedAirport = findAirportByCode(value);

  const [query, setQuery] = useState(
    selectedAirport ? `${selectedAirport.city} (${selectedAirport.code})` : value
  );
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    const match = findAirportByCode(value);
    if (match) {
      setQuery(`${match.city} (${match.code})`);
    } else if (!value) {
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const matches = searchAirports(
    selectedAirport && query === `${selectedAirport.city} (${selectedAirport.code})`
      ? ''
      : query
  );

  const selectAirport = (airport: Airport) => {
    onChange(airport.code);
    setQuery(`${airport.city} (${airport.code})`);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[highlightIdx]) {
        selectAirport(matches[highlightIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-xs font-medium mb-1.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      <div className="relative">
        <Plane
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setHighlightIdx(0);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setOpen(true);
            setHighlightIdx(0);
            const upper = val.trim().toUpperCase();
            if (/^[A-Z]{3}$/.test(upper) && findAirportByCode(upper)) {
              onChange(upper);
            } else if (!val.trim()) {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: error ? 'var(--danger-fg)' : 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger-fg)' }}>
          {error}
        </p>
      )}
      {open && (
        <ul
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-30 mt-1.5 w-full max-h-60 overflow-y-auto rounded-lg border py-1"
          style={{
            backgroundColor: 'var(--bg-popover)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              No matching airports found
            </li>
          ) : (
            matches.map((airport, idx) => (
              <li key={airport.code} role="option" aria-selected={idx === highlightIdx}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectAirport(airport);
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-sm transition-colors"
                  style={{
                    backgroundColor:
                      idx === highlightIdx ? 'var(--bg-surface-subtle)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {airport.city}, {airport.country}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {airport.name}
                    </div>
                  </div>
                  <span
                    className="font-mono-code text-xs font-semibold px-2 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {airport.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
