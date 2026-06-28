import React from 'react';
import { formatNumber, abbreviateNumber } from '../utils/formatters';

/**
 * KPI Dashboard Panel
 * Renders high-density summary metrics.
 * Memoized to isolate rendering; updates only when metrics change.
 */
export const KPIDashboard = React.memo(({ metrics }) => {
  const { totalProcessed, activeRobots, cumulativeSavings } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5" id="kpi-dashboard">
      {/* Total Processed Rows Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-sm">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Telemetry Cycles Processed
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-slate-100 tabular-nums">
            {formatNumber(totalProcessed)}
          </span>
          <span className="text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded">
            Live updates
          </span>
        </div>
      </div>

      {/* Active Robots Deployed Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-sm">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Active Robots Deployed
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-bold text-slate-100 tabular-nums">
            {formatNumber(activeRobots)}
          </span>
          <span className="text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded">
            Operational
          </span>
        </div>
      </div>

      {/* Cumulative Financial Savings Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col justify-between shadow-sm">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Global Cumulative Savings
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span 
            className="text-2xl font-bold text-emerald-400 tabular-nums cursor-help"
            title={`Full value: $${formatNumber(cumulativeSavings)}`}
          >
            {abbreviateNumber(cumulativeSavings, true)}
          </span>
          <span className="text-xs text-teal-400 bg-teal-950/50 border border-teal-900/50 px-2 py-0.5 rounded">
            Direct ROI
          </span>
        </div>
      </div>
    </div>
  );
});

KPIDashboard.displayName = 'KPIDashboard';
