/**
 * Deterministic stable multi-column sorting utility for StreamForge.
 */

/**
 * Sorts an array based on multi-column sort configurations.
 * If all sort configurations are equal, falls back to stable project_id ordering.
 * @param {Array<Object>} data 
 * @param {Array<{column: string, direction: 'asc'|'desc'}>} sortConfig 
 * @returns {Array<Object>}
 */
export const getSortedData = (data, sortConfig) => {
  if (!sortConfig || sortConfig.length === 0) return data;

  const sorted = [...data];

  sorted.sort((a, b) => {
    for (const { column, direction } of sortConfig) {
      const desc = direction === 'desc';
      const valA = a[column];
      const valB = b[column];

      // Handle null/undefined values gracefully
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA !== valB) {
        if (typeof valA === 'string') {
          if (valA < valB) return desc ? 1 : -1;
          if (valA > valB) return desc ? -1 : 1;
        } else {
          // Numbers or booleans
          return desc ? (valB - valA) : (valA - valB);
        }
      }
    }

    // Fall back to project_id for stable sort
    const idA = a.project_id || '';
    const idB = b.project_id || '';
    if (idA < idB) return -1;
    if (idA > idB) return 1;
    return 0;
  });

  return sorted;
};
