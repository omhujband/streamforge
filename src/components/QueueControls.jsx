import React from 'react';

/**
 * QueueControls Component
 * Renders state triggers to pause/play the incoming telemetry updates,
 * displaying a warning state and counting buffered frames.
 */
export const QueueControls = React.memo(({ isPaused, queueSize, onTogglePause, onExport }) => {
  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm" id="queue-controls">
      <button
        type="button"
        onClick={onTogglePause}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all border ${
          isPaused
            ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/60'
            : 'bg-amber-950/20 border-amber-900/40 text-amber-500 hover:bg-amber-900/30'
        }`}
      >
        {isPaused ? (
          <>
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Resume Pipeline
          </>
        ) : (
          <>
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            Pause Grid
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all border border-slate-700 hover:border-slate-500 text-slate-300 bg-slate-950/40 hover:bg-slate-800/40"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export Snapshot
      </button>

      {isPaused ? (
        <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>Grid Frozen</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-900/60 text-amber-300 font-bold tabular-nums">
            {queueSize} updates queued
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Streaming Active</span>
        </div>
      )}
    </div>
  );
});

QueueControls.displayName = 'QueueControls';
