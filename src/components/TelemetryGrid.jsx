import React, { useMemo } from 'react';
import { useVirtualized } from '../hooks/useVirtualized';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// Memoized individual Row component to maximize rendering performance.
// Only re-renders if the row data reference actually changes.
const TelemetryRow = React.memo(({ row, rowHeight, style }) => {
  const isAlert = row.project_status === 'Failed' || row.roi_percent < 0;
  // Flash if updated within the last 3 seconds
  const isRecent = row.lastUpdated && (Date.now() - row.lastUpdated < 3000);
  
  const statusColorMap = {
    Active: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/80',
    Completed: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80',
    Planned: 'text-slate-400 bg-slate-900/60 border-slate-700/60',
    Failed: 'text-rose-400 bg-rose-950/75 border-rose-800/80'
  };

  const alertClass = isAlert
    ? isRecent
      ? 'border-l-4 border-l-rose-500 bg-rose-950/20 animate-[alert-pulse_3s_ease-out_forwards]'
      : 'border-l-4 border-l-rose-900 bg-rose-950/5'
    : 'border-l-4 border-l-transparent hover:bg-slate-900/40';

  return (
    <div
      className={`absolute left-0 right-0 border-b border-slate-800/60 flex items-center text-xs text-slate-300 transition-colors ${alertClass}`}
      style={{
        ...style,
        height: `${rowHeight}px`,
        boxSizing: 'border-box'
      }}
    >
      {/* ID & Company */}
      <div className="w-[100px] px-3 font-mono flex flex-col justify-center">
        <span className="text-slate-200 font-medium">{row.project_id}</span>
        <span className="text-[10px] text-slate-500">{row.company_id}</span>
      </div>

      {/* Project Name */}
      <div className="flex-1 min-w-[150px] px-3 truncate font-medium text-slate-200" title={row.project_name}>
        {row.project_name}
      </div>

      {/* Automation Type & Department */}
      <div className="w-[180px] px-3 flex flex-col justify-center truncate">
        <span className="truncate" title={row.automation_type}>{row.automation_type}</span>
        <span className="text-[10px] text-slate-500 truncate" title={row.department}>{row.department}</span>
      </div>

      {/* Robots Deployed */}
      <div className="w-[90px] px-3 text-right font-mono text-slate-200">
        {formatNumber(row.robots_deployed)}
      </div>

      {/* Budget USD */}
      <div className="w-[110px] px-3 text-right font-mono">
        {formatCurrency(row.budget_usd)}
      </div>

      {/* Savings USD */}
      <div className="w-[110px] px-3 text-right font-mono text-emerald-400">
        {formatCurrency(row.annual_savings_usd)}
      </div>

      {/* ROI Percent */}
      <div className={`w-[90px] px-3 text-right font-mono font-medium ${row.roi_percent < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
        {formatPercent(row.roi_percent)}
      </div>

      {/* Hours Saved */}
      <div className="w-[110px] px-3 text-right font-mono text-indigo-300">
        {formatNumber(row.employee_hours_saved)}
      </div>

      {/* Status Badge */}
      <div className="w-[100px] px-3 flex items-center justify-center">
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColorMap[row.project_status] || 'text-slate-400'}`}>
          {row.project_status}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom compare function to ignore inline style object reference inequality
  return prevProps.row === nextProps.row &&
         prevProps.rowHeight === nextProps.rowHeight &&
         prevProps.style.transform === nextProps.style.transform;
});

TelemetryRow.displayName = 'TelemetryRow';

// Memoized Header component to avoid inline anonymous function allocations in render loop
const SortableHeader = React.memo(({ column, label, sortConfig, onSortChange, widthClass }) => {
  const isSorted = sortConfig.some(s => s.column === column);

  const handleHeaderClick = React.useCallback((e) => {
    onSortChange(column, e.shiftKey);
  }, [column, onSortChange]);

  const renderSortIndicator = () => {
    const sortIdx = sortConfig.findIndex(s => s.column === column);
    if (sortIdx === -1) return null;

    const sortItem = sortConfig[sortIdx];
    const isMulti = sortConfig.length > 1;

    return (
      <span className="inline-flex items-center gap-0.5 ml-1 text-indigo-400 font-bold">
        {sortItem.direction === 'asc' ? '▲' : '▼'}
        {isMulti && (
          <span className="text-[9px] bg-indigo-950 border border-indigo-800 text-indigo-300 px-1 rounded-sm">
            {sortIdx + 1}
          </span>
        )}
      </span>
    );
  };

  return (
    <button
      onClick={handleHeaderClick}
      className={`${widthClass} px-3 text-right hover:text-slate-200 transition-colors flex items-center justify-end font-semibold ${
        isSorted ? 'text-indigo-400 font-bold bg-slate-950/40 py-1.5 rounded' : 'text-slate-400'
      }`}
    >
      {label} {renderSortIndicator()}
    </button>
  );
});

SortableHeader.displayName = 'SortableHeader';

/**
 * TelemetryGrid component
 * Manages rendering of virtualized viewport list and sorting headers.
 */
export const TelemetryGrid = React.memo(({
  rows,
  sortConfig,
  onSortChange
}) => {
  const rowHeight = 44;
  const { containerRef, startIndex, endIndex, totalHeight } = useVirtualized({
    itemCount: rows.length,
    rowHeight,
    buffer: 10
  });

  // Pre-calculate visible slice to avoid allocating array elements in render loop
  const visibleRows = useMemo(() => {
    const slice = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (rows[i]) {
        slice.push({ item: rows[i], index: i });
      }
    }
    return slice;
  }, [rows, startIndex, endIndex]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col h-[520px] shadow-sm select-none">
      {/* Custom Table Head */}
      <div className="bg-slate-900 border-b-2 border-slate-800 flex items-center text-xs font-bold text-slate-300 uppercase tracking-wider h-10 select-none border-l-4 border-l-transparent">
        <div className="w-[100px] px-3 text-slate-400">ID</div>
        <div className="flex-1 min-w-[150px] px-3 text-slate-400">Project Name</div>
        <div className="w-[180px] px-3 text-slate-400">Automation / Dept</div>
        
        <SortableHeader
          column="robots_deployed"
          label="Robots"
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          widthClass="w-[90px]"
        />

        <SortableHeader
          column="budget_usd"
          label="Budget"
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          widthClass="w-[110px]"
        />

        <SortableHeader
          column="annual_savings_usd"
          label="Savings"
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          widthClass="w-[110px]"
        />

        <SortableHeader
          column="roi_percent"
          label="ROI"
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          widthClass="w-[90px]"
        />

        <SortableHeader
          column="employee_hours_saved"
          label="Hours"
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          widthClass="w-[110px]"
        />
        
        <div className="w-[100px] px-3 text-center text-slate-400">Status</div>
      </div>

      {/* Scrollable container with manual viewport virtualization */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative bg-slate-950/20"
        style={{ contentVisibility: 'auto' }}
      >
        {visibleRows.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2 p-5 text-center">
            <svg className="w-8 h-8 opacity-40 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold">No telemetry matches criteria</span>
            <span className="text-xs max-w-xs">Try adjustments to search fields or active category filters.</span>
          </div>
        ) : (
          <>
            {/* Native Scroll height spacer */}
            <div style={{ height: `${totalHeight}px`, width: '100%', pointerEvents: 'none' }} />

            {/* Render node pool */}
            <div className="absolute top-0 left-0 right-0">
              {visibleRows.map(({ item, index }) => (
                <TelemetryRow
                  key={item.project_id}
                  row={item}
                  rowIndex={index}
                  rowHeight={rowHeight}
                  style={{
                    transform: `translateY(${index * rowHeight}px)`
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Grid Footer stats */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Rows Displayed: {formatNumber(rows.length)}</span>
        <span>Custom Virtual Engine Live</span>
      </div>
    </div>
  );
});

TelemetryGrid.displayName = 'TelemetryGrid';
