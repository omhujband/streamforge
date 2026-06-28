import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { useLocalStorage } from './hooks/useLocalStorage';
import { KPIDashboard } from './components/KPIDashboard';
import { FilterPanel } from './components/FilterPanel';
import { SearchBar } from './components/SearchBar';
import { QueueControls } from './components/QueueControls';
import { TelemetryGrid } from './components/TelemetryGrid';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { generateCSV } from './utils/csvExport';

// Optional lightweight FPS Counter enhancement
const FPSCounter = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animFrameId;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta));
        frameCount.current = 0;
        lastTime.current = now;
      }
      animFrameId = requestAnimationFrame(tick);
    };
    animFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-900/60 border border-slate-800 px-2.5 py-0.5 rounded font-mono select-none">
      <span>FPS:</span>
      <span className={fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-500' : 'text-rose-500'}>
        {fps}
      </span>
    </div>
  );
};

function App() {
  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAutomationTypes, setSelectedAutomationTypes] = useState(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());
  const [selectedIndustries, setSelectedIndustries] = useState(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Sort configuration state (Shift-click supports multiple layers)
  const [sortConfig, setSortConfig] = useState([
    { column: 'roi_percent', direction: 'desc' } // Initial default order
  ]);

  // Expose aggregated filter package
  const selectedFilters = useMemo(() => ({
    selectedAutomationTypes,
    selectedDepartments,
    selectedIndustries,
    selectedStatuses
  }), [selectedAutomationTypes, selectedDepartments, selectedIndustries, selectedStatuses]);

  // Telemetry core stream ingestion hook with active filter/search/sort states
  const {
    allRows,
    processedRows,
    metrics,
    isLoading,
    isPaused,
    queueSize,
    processingRate,
    togglePause
  } = useTelemetry(selectedFilters, searchQuery, sortConfig);

  // Layout preferences (toggled widgets) persisted to local storage
  const [showKPI, setShowKPI] = useLocalStorage('sf_layout_show_kpi', true);
  const [showCharts, setShowCharts] = useLocalStorage('sf_layout_show_charts', true);
  
  // Presets persisted to local storage
  const [savedPresets, setSavedPresets] = useLocalStorage('sf_filter_presets', []);
  const [newPresetName, setNewPresetName] = useState('');

  // Extract unique category options once from baseline rows after loading
  const [uniqueCategories, setUniqueCategories] = useState({
    automationTypes: [],
    departments: [],
    industries: [],
    statuses: []
  });

  useEffect(() => {
    if (allRows.length > 0 && uniqueCategories.automationTypes.length === 0) {
      const automations = new Set();
      const depts = new Set();
      const inds = new Set();
      const stats = new Set();

      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        if (row.automation_type) automations.add(row.automation_type);
        if (row.department) depts.add(row.department);
        if (row.industry) inds.add(row.industry);
        if (row.project_status) stats.add(row.project_status);
      }

      setUniqueCategories({
        automationTypes: Array.from(automations).sort(),
        departments: Array.from(depts).sort(),
        industries: Array.from(inds).sort(),
        statuses: Array.from(stats).sort()
      });
    }
  }, [allRows, uniqueCategories]);

  // State handlers for search input change
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // State handlers for toggling filter selections
  const handleFilterChange = useCallback((category, value) => {
    const updateSet = (prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(value)) {
        nextSet.delete(value);
      } else {
        nextSet.add(value);
      }
      return nextSet;
    };

    if (category === 'automation_type') setSelectedAutomationTypes(updateSet);
    if (category === 'department') setSelectedDepartments(updateSet);
    if (category === 'industry') setSelectedIndustries(updateSet);
    if (category === 'project_status') setSelectedStatuses(updateSet);
  }, []);

  // Clear all selections
  const handleResetFilters = useCallback(() => {
    setSelectedAutomationTypes(new Set());
    setSelectedDepartments(new Set());
    setSelectedIndustries(new Set());
    setSelectedStatuses(new Set());
    setSearchQuery('');
  }, []);

  // Multi-column sorting configuration toggle (Shift + click)
  const handleSortChange = useCallback((column, isShift) => {
    setSortConfig((prevConfig) => {
      const existingIndex = prevConfig.findIndex(c => c.column === column);

      if (isShift) {
        // Multi-column sorting
        if (existingIndex > -1) {
          const item = prevConfig[existingIndex];
          const nextDirection = item.direction === 'asc' ? 'desc' : 'asc';
          const nextConfig = [...prevConfig];
          nextConfig[existingIndex] = { column, direction: nextDirection };
          return nextConfig;
        } else {
          return [...prevConfig, { column, direction: 'asc' }];
        }
      } else {
        // Single-column sorting
        if (existingIndex > -1 && prevConfig.length === 1) {
          const item = prevConfig[existingIndex];
          if (item.direction === 'asc') {
            return [{ column, direction: 'desc' }];
          } else {
            return []; // Clear sort
          }
        } else {
          return [{ column, direction: 'asc' }];
        }
      }
    });
  }, []);

  // Export Snapshot logic (native downloadable CSV generation)
  const handleExport = useCallback(() => {
    if (!processedRows || processedRows.length === 0) return;

    const csvContent = generateCSV(processedRows);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `StreamForge_Snapshot_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      filename,
      rowCount: processedRows.length
    });
  }, [processedRows]);

  // Self-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Save current filter combinations as a preset
  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const preset = {
      name: newPresetName.trim(),
      search: searchQuery,
      filters: {
        automationTypes: Array.from(selectedAutomationTypes),
        departments: Array.from(selectedDepartments),
        industries: Array.from(selectedIndustries),
        statuses: Array.from(selectedStatuses)
      }
    };

    setSavedPresets((prev) => [...prev, preset]);
    setNewPresetName('');
  };

  // Apply a selected preset
  const handleApplyPreset = (preset) => {
    setSearchQuery(preset.search);
    setSelectedAutomationTypes(new Set(preset.filters.automationTypes));
    setSelectedDepartments(new Set(preset.filters.departments));
    setSelectedIndustries(new Set(preset.filters.industries));
    setSelectedStatuses(new Set(preset.filters.statuses));
  };

  const handleRemovePreset = (presetName) => {
    setSavedPresets((prev) => prev.filter(p => p.name !== presetName));
  };

  // Presets and saved filter configuration mapping

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090a0f] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">
          Mounting Telemetry Pool...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#090a0f] p-3 text-slate-300">
      {/* Header bar */}
      <header className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-black text-slate-100 text-sm">
              S
            </div>
            {/* Pulsing LIVE stream indicator */}
            {!isPaused && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            {isPaused && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider my-0">
                StreamForge
              </h1>
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 font-bold tracking-wide uppercase select-none">
                <span className={`w-1 h-1 rounded-full bg-emerald-400 ${!isPaused ? 'animate-pulse' : ''}`}></span>
                {isPaused ? 'Paused' : 'Live'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              High-Density RPA Telemetry Terminal
            </span>
          </div>
        </div>

        {/* Quick Diagnostics and layout toggles */}
        <div className="flex items-center gap-3">
          {/* Live Ingestion processing rate metric */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-900/60 border border-slate-800 px-2.5 py-0.5 rounded font-mono select-none">
            <span>Rate:</span>
            <span className="text-indigo-400 tabular-nums">
              {processingRate} rec/s
            </span>
          </div>

          <FPSCounter />

          {/* KPI Toggle */}
          <button
            onClick={() => setShowKPI(!showKPI)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
              showKPI 
                ? 'bg-indigo-950/20 border-indigo-800 text-indigo-400' 
                : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            KPIs
          </button>

          {/* Charts Toggle */}
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
              showCharts 
                ? 'bg-indigo-950/20 border-indigo-800 text-indigo-400' 
                : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Charts
          </button>
        </div>
      </header>

      {/* KPI Dashboard widget */}
      {showKPI && (
        <div className="widget-enter">
          <KPIDashboard metrics={metrics} />
        </div>
      )}

      {/* Control console panel */}
      <div className="flex flex-col gap-2.5 mb-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Debounced Search */}
          <SearchBar onSearchChange={handleSearchChange} />

          {/* Ingestion Buffer Pause/Resume Controls */}
          <QueueControls
            isPaused={isPaused}
            queueSize={queueSize}
            onTogglePause={togglePause}
            onExport={handleExport}
          />
        </div>

        {/* Presets and custom settings bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between border-t border-slate-800/80 pt-3 z-10">
          <form onSubmit={handleSavePreset} className="flex gap-2 items-center">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Save current filters as preset..."
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-52"
            />
            <button
              type="submit"
              disabled={!newPresetName.trim()}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </form>

          {/* Display Preset selections */}
          {savedPresets.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Presets:</span>
              {savedPresets.map((preset) => (
                <div 
                  key={preset.name}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-indigo-400 font-medium"
                >
                  <button 
                    onClick={() => handleApplyPreset(preset)}
                    className="hover:text-indigo-300 font-bold"
                  >
                    {preset.name}
                  </button>
                  <button 
                    onClick={() => handleRemovePreset(preset.name)}
                    className="text-slate-600 hover:text-rose-400 font-bold"
                    title="Remove Preset"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Panel */}
      <FilterPanel
        uniqueCategories={uniqueCategories}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Main virtualized telemetry grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <TelemetryGrid
          rows={processedRows}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Analytics widgets */}
      {showCharts && (
        <div className="widget-enter mt-5">
          <AnalyticsPanel data={processedRows} />
        </div>
      )}

      {/* Confirmation Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-emerald-800/80 text-slate-100 p-3 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-[alert-pulse_0.3s_ease-out]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <div className="text-xs">
            <div className="font-bold text-emerald-400">Export Successful</div>
            <div className="text-slate-400">Exported {toast.rowCount.toLocaleString()} rows</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 select-all">{toast.filename}</div>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 font-bold text-sm ml-2 cursor-pointer"
            title="Dismiss Alert"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
