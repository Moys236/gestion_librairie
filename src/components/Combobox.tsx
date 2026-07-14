'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface OptionObject {
  id: string | number;
  name: string;
}

type Option = string | OptionObject;

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine if the current value matches a predefined option
  const isSelected = useMemo(() => {
    if (!value) return false;
    return options.some((opt) => {
      const optName = typeof opt === 'string' ? opt : opt.name;
      return optName.toLowerCase() === value.toLowerCase();
    });
  }, [value, options]);

  // Real-time filtering of options when input is editable (not locked)
  const filteredOptions = useMemo(() => {
    if (isSelected) return [];
    const search = value.toLowerCase().trim();
    return options.filter((opt) => {
      const name = typeof opt === 'string' ? opt : opt.name;
      return name.toLowerCase().includes(search);
    });
  }, [options, value, isSelected]);

  const handleSelectOption = (optName: string) => {
    onChange(optName);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1 w-full min-w-0" ref={containerRef}>
      <div
        className={`input flex items-stretch w-full bg-white transition-all duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-ring ${
          isSelected ? 'bg-gray-100' : ''
        }`}
        style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          width: '100%',
        }}
      >
        <input
          type="text"
          className={`w-full bg-transparent text-sm text-text outline-none border-none flex-1 ${
            isSelected ? 'cursor-not-allowed text-light' : ''
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSelected}
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            margin: 0,
            padding: '0.5rem 0.75rem', // Match .input padding exactly for identical height/width
          }}
        />
        {isSelected && (
          <button
            type="button"
            className="text-text-light hover:text-danger flex items-center justify-center transition-colors bg-transparent"
            onClick={handleClear}
            title="مسح الاختيار / Effacer"
            style={{
              borderRadius: 0,
              padding: '0 10px',
              border: 'none',
              margin: 0,
              alignSelf: 'stretch',
              display: 'flex',
            }}
          >
            {/* Clear icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              width="14"
              height="14"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="bg-gray-50 hover:bg-gray-100 text-text-light flex items-center justify-center transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          title="عرض الخيارات / Options"
          style={{
            borderRadius: 0,
            padding: '0 12px',
            borderTop: 'none',
            borderBottom: 'none',
            borderInlineStart: '1px solid var(--color-border)',
            borderInlineEnd: 'none',
            borderLeft: 'none', // override potential legacy LTR fallback
            alignSelf: 'stretch',
            display: 'flex',
            margin: 0,
          }}
        >
          {/* Chevron icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            width="14"
            height="14"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 bg-white border border-border rounded-md shadow-lg mt-1 w-full left-0 right-0 max-h-60 overflow-y-auto"
          style={{
            direction: 'rtl',
            top: '100%',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const optName = typeof opt === 'string' ? opt : opt.name;
              const isCurrent = value.toLowerCase() === optName.toLowerCase();
              return (
                <button
                  key={optName}
                  type="button"
                  className={`w-full text-right px-4 py-2 text-sm transition-colors block border-b border-gray-100 last:border-0 ${
                    isCurrent
                      ? 'bg-brand-light text-brand font-semibold'
                      : 'hover:bg-gray-50 text-text'
                  }`}
                  onClick={() => handleSelectOption(optName)}
                  style={{
                    borderRadius: 0,
                    margin: 0,
                  }}
                >
                  {optName}
                </button>
              );
            })
          ) : isSelected ? (
            <div className="px-4 py-3 text-xs text-light text-center">
              تم تحديد خيار. انقر على الزر x لتغييره.
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-light text-center">
              لا توجد نتائج / Aucun résultat
            </div>
          )}
        </div>
      )}
    </div>
  );
}
