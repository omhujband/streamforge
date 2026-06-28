import React, { useState, useEffect, useRef } from 'react';

/**
 * SearchBar Component
 * Renders a debounced search input to optimize performance.
 */
export const SearchBar = React.memo(({ onSearchChange }) => {
  const [value, setValue] = useState('');
  const debounceTimer = useRef(null);

  const handleInput = (e) => {
    const val = e.target.value;
    setValue(val);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearchChange(val);
    }, 150); // 150ms debounce
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 min-w-[250px]">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInput}
          placeholder="Fuzzy search project name, partner, country, company ID..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
        />
        {value && (
          <button
            onClick={() => {
              setValue('');
              onSearchChange('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
