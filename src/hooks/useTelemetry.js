import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToTelemetry, initializeTelemetryStream } from '../services/telemetryService';
import { getSortedData } from '../utils/sorters';
import { matchRow as matchSearchTerms } from '../utils/search';

/**
 * Check if a row matches the current category filters and search terms.
 */
const isRowMatching = (row, filters, searchTerms) => {
  const { selectedAutomationTypes, selectedDepartments, selectedIndustries, selectedStatuses } = filters;

  if (selectedAutomationTypes.size > 0 && !selectedAutomationTypes.has(row.automation_type)) return false;
  if (selectedDepartments.size > 0 && !selectedDepartments.has(row.department)) return false;
  if (selectedIndustries.size > 0 && !selectedIndustries.has(row.industry)) return false;
  if (selectedStatuses.size > 0 && !selectedStatuses.has(row.project_status)) return false;

  return matchSearchTerms(row, searchTerms);
};

/**
 * Custom hook to manage central telemetry state with incremental updates.
 */
export const useTelemetry = (selectedFilters, searchQuery, sortConfig) => {
  const [allRows, setAllRows] = useState([]);
  const [processedRows, setProcessedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [processingRate, setProcessingRate] = useState(0);

  const [metrics, setMetrics] = useState({
    totalProcessed: 0,
    activeRobots: 0,
    cumulativeSavings: 0
  });

  // Keep references to access the latest state in async subscriptions without re-triggering effects
  const allRowsRef = useRef([]);
  const isPausedRef = useRef(false);
  const queueRef = useRef([]);
  const rowMapRef = useRef(new Map());
  const tickHistoryRef = useRef([]);
  
  // High-performance index maps for O(1) row lookups in arrays
  const rowIndexMapRef = useRef(new Map()); // project_id -> index in allRows
  const processedRowIndexMapRef = useRef(new Map()); // project_id -> index in processedRows

  // Store active filter parameters in refs to prevent subscription teardowns on ticks
  const filtersRef = useRef(selectedFilters);
  const searchQueryRef = useRef(searchQuery);
  const sortConfigRef = useRef(sortConfig);

  // Store metrics in a ref to allow safe incremental updates
  const metricsRef = useRef({
    totalProcessed: 0,
    activeRobots: 0,
    cumulativeSavings: 0
  });

  // Sync state parameters to refs
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    filtersRef.current = selectedFilters;
    searchQueryRef.current = searchQuery;
    sortConfigRef.current = sortConfig;
  }, [selectedFilters, searchQuery, sortConfig]);

  // Decoupled full pipeline rebuild (Filter -> Search -> Sort) on user input changes
  const rebuildProcessedData = useCallback(() => {
    const filters = filtersRef.current;
    const query = searchQueryRef.current.trim().toLowerCase();
    const searchTerms = query ? query.split(/\s+/).filter(Boolean) : [];
    const sorting = sortConfigRef.current;

    let result = [];
    const rows = allRowsRef.current;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isRowMatching(row, filters, searchTerms)) {
        result.push(row);
      }
    }

    if (sorting && sorting.length > 0) {
      result = getSortedData(result, sorting);
    }

    const newProcessedMap = new Map();
    for (let i = 0; i < result.length; i++) {
      newProcessedMap.set(result[i].project_id, i);
    }
    processedRowIndexMapRef.current = newProcessedMap;
    setProcessedRows(result);
  }, []);

  // Trigger rebuild when baseline loading completes or user inputs mutate
  useEffect(() => {
    if (isLoading) return;
    rebuildProcessedData();
  }, [isLoading, selectedFilters, searchQuery, sortConfig, rebuildProcessedData]);

  // Load and parse initial CSV
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("⚡ [Telemetry State] Loading baseline CSV...");
        const response = await fetch(`${import.meta.env.BASE_URL}automation_projects.csv`);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const csvText = await response.text();
        
        // Fast optimized line-by-line parsing
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = [];
        const map = new Map();
        
        let initialRobots = 0;
        let initialSavings = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, idx) => {
              const val = values[idx].trim();
              if (['robots_deployed', 'budget_usd', 'annual_savings_usd', 'employee_hours_saved'].includes(header)) {
                row[header] = parseInt(val, 10) || 0;
              } else if (header === 'roi_percent') {
                row[header] = parseFloat(val) || 0.0;
              } else {
                row[header] = val;
              }
            });
            // Assign internal unique ID if not present
            row.internal_uid = row.internal_uid || `uid-row-${i}`;
            
            rowIndexMapRef.current.set(row.project_id, data.length);
            data.push(row);
            map.set(row.project_id, row);
            
            // Sum initial metrics
            initialRobots += row.robots_deployed;
            initialSavings += row.annual_savings_usd;
          }
        }

        rowMapRef.current = map;
        allRowsRef.current = data;

        const initialMetrics = {
          totalProcessed: 0,
          activeRobots: initialRobots,
          cumulativeSavings: initialSavings
        };
        metricsRef.current = initialMetrics;

        setAllRows(data);
        setMetrics(initialMetrics);
        setIsLoading(false);
        console.log(`✅ [Telemetry State] Ingested ${data.length} rows. Active Robots: ${initialRobots}. Savings: $${initialSavings.toLocaleString()}`);

        // Initialize connection to dataStream
        initializeTelemetryStream();
      } catch (err) {
        console.error("❌ [Telemetry State] Failed loading baseline CSV:", err);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscribe to live telemetry stream updates
  useEffect(() => {
    if (isLoading) return;

    const unsubscribe = subscribeToTelemetry((incomingBatch) => {
      if (!incomingBatch || incomingBatch.length === 0) return;

      const now = Date.now();
      
      // Calculate records/second processing rate in a 2-second window
      tickHistoryRef.current.push({ timestamp: now, count: incomingBatch.length });
      tickHistoryRef.current = tickHistoryRef.current.filter(t => now - t.timestamp < 2000);
      const totalInWindow = tickHistoryRef.current.reduce((sum, t) => sum + t.count, 0);
      const elapsed = tickHistoryRef.current.length > 1
        ? (now - tickHistoryRef.current[0].timestamp) / 1000
        : 1;
      setProcessingRate(Math.round(totalInWindow / elapsed));

      let robotsDelta = 0;
      let savingsDelta = 0;
      const batchIds = new Set();

      // Process deltas immediately for live KPIs (even if UI is paused)
      for (const updatedRow of incomingBatch) {
        // Clone the row and inject lastUpdated timestamp for the UI visual alerts
        const rowWithTime = { ...updatedRow, lastUpdated: now };
        const oldRow = rowMapRef.current.get(rowWithTime.project_id);
        if (oldRow) {
          robotsDelta += (rowWithTime.robots_deployed - oldRow.robots_deployed);
          savingsDelta += (rowWithTime.annual_savings_usd - oldRow.annual_savings_usd);
        } else {
          // If a new project is created/streamed
          robotsDelta += rowWithTime.robots_deployed;
          savingsDelta += rowWithTime.annual_savings_usd;
        }
        
        // Cache the latest value in our memory map
        rowMapRef.current.set(rowWithTime.project_id, rowWithTime);
        batchIds.add(rowWithTime.project_id);
      }

      // Increment metrics state
      const nextMetrics = {
        totalProcessed: metricsRef.current.totalProcessed + incomingBatch.length,
        activeRobots: Math.max(0, metricsRef.current.activeRobots + robotsDelta),
        cumulativeSavings: Math.max(0, metricsRef.current.cumulativeSavings + savingsDelta)
      };
      metricsRef.current = nextMetrics;
      setMetrics(nextMetrics);

      // Mutate allRows baseline by index
      const nextAllRows = [...allRowsRef.current];
      for (const updatedRow of incomingBatch) {
        const idx = rowIndexMapRef.current.get(updatedRow.project_id);
        if (idx !== undefined) {
          nextAllRows[idx] = rowMapRef.current.get(updatedRow.project_id);
        }
      }
      allRowsRef.current = nextAllRows;
      setAllRows(nextAllRows);
      // Handle UI rendering state
      if (isPausedRef.current) {
        // Buffer the batch
        queueRef.current.push(batchIds);
        setQueueSize(queueRef.current.length);
      } else {
        // Perform incremental updates on processedRows in O(batchSize)
        setProcessedRows((prevProcessed) => {
          let nextProcessed = [...prevProcessed];
          let resortRequired = false;
          let rebuildRequired = false;

          const filters = filtersRef.current;
          const query = searchQueryRef.current.trim().toLowerCase();
          const searchTerms = query ? query.split(/\s+/).filter(Boolean) : [];
          const sorting = sortConfigRef.current;

          for (const updatedRow of incomingBatch) {
            const rowWithTime = rowMapRef.current.get(updatedRow.project_id);
            const matches = isRowMatching(rowWithTime, filters, searchTerms);
            const currentIdx = processedRowIndexMapRef.current.get(rowWithTime.project_id);

            if (matches) {
              if (currentIdx !== undefined) {
                const oldRow = nextProcessed[currentIdx];
                // Only mark resortRequired if sorting column values actually changed
                if (sorting && sorting.length > 0 && !resortRequired) {
                  for (const { column } of sorting) {
                    if (oldRow[column] !== rowWithTime[column]) {
                      resortRequired = true;
                      break;
                    }
                  }
                }
                nextProcessed[currentIdx] = rowWithTime;
              } else {
                // Row transitioned to matching: rebuild to avoid index shifting bugs
                rebuildRequired = true;
                break;
              }
            } else {
              if (currentIdx !== undefined) {
                // Row transitioned to not matching: rebuild to avoid index shifting bugs
                rebuildRequired = true;
                break;
              }
            }
          }

          // If a row transitioned in or out of the filtered set, perform a full O(N) rebuild
          if (rebuildRequired) {
            const result = [];
            const rows = allRowsRef.current;
            for (let i = 0; i < rows.length; i++) {
              const r = rows[i];
              if (isRowMatching(r, filters, searchTerms)) {
                result.push(r);
              }
            }
            if (sorting && sorting.length > 0) {
              nextProcessed = getSortedData(result, sorting);
            } else {
              nextProcessed = result;
            }

            const newIdxMap = new Map();
            for (let i = 0; i < nextProcessed.length; i++) {
              newIdxMap.set(nextProcessed[i].project_id, i);
            }
            processedRowIndexMapRef.current = newIdxMap;
            return nextProcessed;
          }

          // Sort array only when active sorting columns mutate
          if (resortRequired && sorting && sorting.length > 0) {
            nextProcessed = getSortedData(nextProcessed, sorting);
            // Rebuild index mapping since sort order changed
            const newIdxMap = new Map();
            for (let i = 0; i < nextProcessed.length; i++) {
              newIdxMap.set(nextProcessed[i].project_id, i);
            }
            processedRowIndexMapRef.current = newIdxMap;
          }

          return nextProcessed;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoading]);

  // Toggle pause controls
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const nextState = !prev;
      if (!nextState) {
        // RESUME: Flush queued updates
        if (queueRef.current.length > 0) {
          const mergedQueuedIds = new Set();
          for (const batchIds of queueRef.current) {
            batchIds.forEach(id => mergedQueuedIds.add(id));
          }

          // Mutate allRows baseline by index
          const nextAllRows = [...allRowsRef.current];
          for (const id of mergedQueuedIds) {
            const idx = rowIndexMapRef.current.get(id);
            if (idx !== undefined) {
              nextAllRows[idx] = rowMapRef.current.get(id);
            }
          }
          allRowsRef.current = nextAllRows;
          setAllRows(nextAllRows);

          // Full rebuild to guarantee clean, uncorrupted, and sorted grid rows
          rebuildProcessedData();

          queueRef.current = [];
          setQueueSize(0);
        }
      }
      return nextState;
    });
  }, [rebuildProcessedData]);

  return {
    allRows,
    processedRows,
    metrics,
    isLoading,
    isPaused,
    queueSize,
    processingRate,
    togglePause
  };
};
