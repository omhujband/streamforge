/**
 * Pure formatting utility functions for StreamForge.
 */

/**
 * Format raw numbers to USD currency without decimals.
 * @param {number} val 
 * @returns {string}
 */
export const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * Format ROI percentage, clamped to two decimal places.
 * @param {number} val 
 * @returns {string}
 */
export const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  return `${val.toFixed(2)}%`;
};

/**
 * Format integers with thousand separators.
 * @param {number} val 
 * @returns {string}
 */
export const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US').format(val);
};

/**
 * Abbreviate large numbers for high-density cards (e.g. 1.2M, 4.5K)
 * @param {number} val 
 * @param {boolean} isCurrency 
 * @returns {string}
 */
export const abbreviateNumber = (val, isCurrency = false) => {
  if (val === undefined || val === null || isNaN(val)) return isCurrency ? '$0' : '0';
  const prefix = isCurrency ? '$' : '';
  if (val >= 1e9) {
    return `${prefix}${(val / 1e9).toFixed(2)}B`;
  }
  if (val >= 1e6) {
    return `${prefix}${(val / 1e6).toFixed(2)}M`;
  }
  if (val >= 1e3) {
    return `${prefix}${(val / 1e3).toFixed(1)}K`;
  }
  return `${prefix}${formatNumber(val)}`;
};
