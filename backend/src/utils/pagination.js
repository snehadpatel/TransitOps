/**
 * Parses pagination query parameters with safe defaults.
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Wraps a paginated Prisma result in a standard envelope.
 * @param {any[]} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
function paginationMeta(data, total, page, limit) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { parsePagination, paginationMeta };
