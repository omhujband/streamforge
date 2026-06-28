/**
 * Standalone client-side CSV generator for StreamForge.
 */

const HEADERS = [
  'project_id',
  'project_name',
  'company_id',
  'automation_type',
  'department',
  'industry',
  'robots_deployed',
  'budget_usd',
  'annual_savings_usd',
  'roi_percent',
  'employee_hours_saved',
  'project_status',
  'cloud_deployment',
  'ai_enabled',
  'country'
];

/**
 * Converts the active dataset array into a standard CSV string.
 * @param {Array<Object>} rows 
 * @returns {string}
 */
export const generateCSV = (rows) => {
  if (!rows || rows.length === 0) return '';

  const csvRows = [];

  // Header row
  const headerString = HEADERS.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  csvRows.push(headerString);

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const values = HEADERS.map((header) => {
      const val = row[header];
      if (val === undefined || val === null) return '""';
      
      const strVal = String(val);
      // Escape inner quotes by doubling them according to RFC 4180
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};
