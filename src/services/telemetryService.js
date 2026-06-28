/**
 * Telemetry Ingestion Service
 * Connects to the global organizers' harness window.initializeRpaStream
 * and broadcasts incoming updates to registered observers.
 */

let isInitialized = false;
const subscribers = new Set();

/**
 * Register a callback to receive incoming telemetry batches.
 * @param {Function} callback 
 * @returns {Function} unsubscribe function
 */
export const subscribeToTelemetry = (callback) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Trigger stream initialization. Safe to call multiple times.
 */
export const initializeTelemetryStream = () => {
  if (isInitialized) return;

  if (typeof window !== 'undefined' && window.initializeRpaStream) {
    window.initializeRpaStream((incomingBatch) => {
      subscribers.forEach((callback) => {
        try {
          callback(incomingBatch);
        } catch (err) {
          console.error("Error in telemetry subscriber callback:", err);
        }
      });
    }, `${import.meta.env.BASE_URL}automation_projects.csv`);
    isInitialized = true;
    console.log("📡 [Telemetry Service] Stream listener mounted successfully.");
  } else {
    console.error("❌ [Telemetry Service] window.initializeRpaStream hook is missing from the global window context.");
  }
};
