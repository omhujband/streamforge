import React, { useState } from 'react';

/**
 * FilterPanel Component
 * Provides multi-select dropdown controls for Automation Type, Department, Industry, and Status.
 */
export const FilterPanel = React.memo(({
  uniqueCategories,
  selectedFilters,
  onFilterChange,
  onResetFilters
}) => {
  const { automationTypes, departments, industries, statuses } = uniqueCategories;
  const { selectedAutomationTypes, selectedDepartments, selectedIndustries, selectedStatuses } = selectedFilters;

  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleCheckboxChange = (category, value) => {
    onFilterChange(category, value);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const totalActive = selectedAutomationTypes.size + selectedDepartments.size + selectedIndustries.size + selectedStatuses.size;

  return (
    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg mb-3 flex flex-wrap gap-4 items-center justify-between shadow-sm relative z-20">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mr-1">
          Telemetry Filters:
        </span>

        {/* Automation Type Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleDropdown('automation')}
            className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center gap-2 bg-slate-950 transition-colors ${
              selectedAutomationTypes.size > 0 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Automation Type {selectedAutomationTypes.size > 0 && `(${selectedAutomationTypes.size})`}
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {activeDropdown === 'automation' && (
            <div className="absolute left-0 mt-1.5 w-64 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-md shadow-xl py-1 z-30">
              {automationTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedAutomationTypes.has(type)}
                    onChange={() => handleCheckboxChange('automation_type', type)}
                    className="mr-2.5 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500"
                  />
                  {type}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Department Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleDropdown('department')}
            className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center gap-2 bg-slate-950 transition-colors ${
              selectedDepartments.size > 0 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Department {selectedDepartments.size > 0 && `(${selectedDepartments.size})`}
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeDropdown === 'department' && (
            <div className="absolute left-0 mt-1.5 w-64 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-md shadow-xl py-1 z-30">
              {departments.map((dept) => (
                <label
                  key={dept}
                  className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.has(dept)}
                    onChange={() => handleCheckboxChange('department', dept)}
                    className="mr-2.5 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500"
                  />
                  {dept}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Industry Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleDropdown('industry')}
            className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center gap-2 bg-slate-950 transition-colors ${
              selectedIndustries.size > 0 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Industry {selectedIndustries.size > 0 && `(${selectedIndustries.size})`}
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeDropdown === 'industry' && (
            <div className="absolute left-0 mt-1.5 w-64 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-md shadow-xl py-1 z-30">
              {industries.map((ind) => (
                <label
                  key={ind}
                  className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndustries.has(ind)}
                    onChange={() => handleCheckboxChange('industry', ind)}
                    className="mr-2.5 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500"
                  />
                  {ind}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleDropdown('status')}
            className={`px-3 py-1.5 text-xs font-medium rounded border flex items-center gap-2 bg-slate-950 transition-colors ${
              selectedStatuses.size > 0 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Project Status {selectedStatuses.size > 0 && `(${selectedStatuses.size})`}
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {activeDropdown === 'status' && (
            <div className="absolute left-0 mt-1.5 w-48 bg-slate-950 border border-slate-800 rounded-md shadow-xl py-1 z-30">
              {statuses.map((status) => (
                <label
                  key={status}
                  className="flex items-center px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(status)}
                    onChange={() => handleCheckboxChange('project_status', status)}
                    className="mr-2.5 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500"
                  />
                  {status}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {totalActive > 0 && (
        <button
          onClick={onResetFilters}
          className="text-xs text-rose-400 hover:text-rose-300 transition-colors px-2 py-1 rounded hover:bg-rose-950/20 border border-rose-900/30 bg-rose-950/10"
        >
          Reset Filters ({totalActive})
        </button>
      )}
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

// Note: useEffect import was missing in React scope. Adding import dynamically.
import { useEffect } from 'react';
