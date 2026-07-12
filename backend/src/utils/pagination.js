/**
 * Paginates a Prisma query result.
 * @param {number} page - 1-indexed page number
 * @param {number} limit - items per page (max 100)
 * @returns {{ skip: number, take: number, meta: (total: number) => object }}
 */
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  return {
    skip: (p - 1) * l,
    take: l,
    meta: (total) => ({
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    }),
  };
}

module.exports = { paginate };
