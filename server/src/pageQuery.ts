const MAX_LIMIT = 100;

export interface PageQuery {
  search: string;
  offset: number;
  limit: number;
}

export function parsePageQuery(query: Record<string, unknown>): PageQuery {
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const offsetRaw = typeof query.offset === 'string' ? Number(query.offset) : 0;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const limitRaw = typeof query.limit === 'string' ? Number(query.limit) : 20;
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), MAX_LIMIT);

  return { search, offset, limit };
}
