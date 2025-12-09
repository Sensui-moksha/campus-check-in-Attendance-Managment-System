/**
 * Pagination utility helper
 * Standardizes pagination across list endpoints
 */

/**
 * Calculate pagination parameters
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} limit - Items per page
 * @returns {Object} { page, limit, skip }
 */
function getPaginationParams(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (p - 1) * l;

  return {
    page: p,
    limit: l,
    skip,
  };
}

/**
 * Format paginated response
 * @param {Array} items - Data items
 * @param {Number} total - Total count
 * @param {Object} pagination - { page, limit, skip }
 * @returns {Object} Formatted response
 */
function formatPaginatedResponse(items, total, pagination) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
