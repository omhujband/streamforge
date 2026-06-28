import React, { useMemo } from 'react';
import { abbreviateNumber, formatNumber } from '../utils/formatters';

/**
 * AnalyticsPanel Component
 * Renders pure SVG-based analytics bar and horizontal charts.
 * Memoized and computed with high efficiency.
 */
export const AnalyticsPanel = React.memo(({ data }) => {
  const aggregates = useMemo(() => {
    if (!data || data.length === 0) {
      return { topDepartments: [], topIndustries: [] };
    }

    const deptMap = {};
    const indMap = {};

    // Single pass O(N) aggregate calculation
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.department) {
        deptMap[row.department] = (deptMap[row.department] || 0) + (row.robots_deployed || 0);
      }
      if (row.industry) {
        indMap[row.industry] = (indMap[row.industry] || 0) + (row.annual_savings_usd || 0);
      }
    }

    // Sort and slice top 5
    const topDepartments = Object.entries(deptMap)
      .map(([name, robots]) => ({ name, value: robots }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topIndustries = Object.entries(indMap)
      .map(([name, savings]) => ({ name, value: savings }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { topDepartments, topIndustries };
  }, [data]);

  const { topDepartments, topIndustries } = aggregates;

  // Render Horizontal Bar Chart for Departments
  const maxDeptValue = topDepartments[0]?.value || 1;
  const maxIndValue = topIndustries[0]?.value || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5" id="analytics-panel">
      {/* Department Robot Deployments Panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
          Robot Deployments by Department
        </h3>
        {topDepartments.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
            No department data available.
          </div>
        ) : (
          <div className="space-y-3.5">
            {topDepartments.map((item) => {
              const percentage = (item.value / maxDeptValue) * 100;
              return (
                <div key={item.name} className="flex flex-col gap-1 select-none">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300 truncate w-48">{item.name}</span>
                    <span className="text-slate-100 font-mono tabular-nums">{formatNumber(item.value)} bots</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/40">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Industry Cumulative Savings Panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
          Cumulative Savings by Industry
        </h3>
        {topIndustries.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
            No industry data available.
          </div>
        ) : (
          <div className="space-y-3.5">
            {topIndustries.map((item) => {
              const percentage = (item.value / maxIndValue) * 100;
              return (
                <div key={item.name} className="flex flex-col gap-1 select-none">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300 truncate w-48">{item.name}</span>
                    <span className="text-emerald-400 font-mono tabular-nums">{abbreviateNumber(item.value, true)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/40">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

AnalyticsPanel.displayName = 'AnalyticsPanel';
