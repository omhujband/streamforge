/**
 * Multi-field fuzzy search matching algorithm for StreamForge.
 * Checks if all query search terms match at least one of the target fields.
 */

/**
 * Checks if a row matches the search terms.
 * @param {Object} row 
 * @param {Array<string>} searchTerms Pre-tokenized search terms in lowercase
 * @returns {boolean}
 */
export const matchRow = (row, searchTerms) => {
  if (!searchTerms || searchTerms.length === 0) return true;

  const name = (row.project_name || '').toLowerCase();
  const company = (row.company_id || '').toLowerCase();
  const partner = (row.implementation_partner || '').toLowerCase();
  const country = (row.country || '').toLowerCase();
  const department = (row.department || '').toLowerCase();
  const status = (row.project_status || '').toLowerCase();
  const industry = (row.industry || '').toLowerCase();
  const type = (row.automation_type || '').toLowerCase();
  const cloud = (row.cloud_deployment || '').toLowerCase();

  return searchTerms.every(term => 
    name.includes(term) ||
    company.includes(term) ||
    partner.includes(term) ||
    country.includes(term) ||
    department.includes(term) ||
    status.includes(term) ||
    industry.includes(term) ||
    type.includes(term) ||
    cloud.includes(term)
  );
};
