import { useCallback, useEffect, useRef, useState } from 'react';
import { Item, PageResult } from '../types';

export function usePaginatedList(
  search: string,
  initialParam: number,
  fetchPage: (search: string, param: number) => Promise<PageResult>
) {
  const [items, setItems] = useState<Item[]>([]);
  const [param, setParam] = useState<number>(initialParam);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    loadingRef.current = false;
    setItems([]);
    setParam(initialParam);
    setHasMore(true);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    reset();
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    const myRequestId = requestIdRef.current;
    try {
      const page = await fetchPageRef.current(search, param);
      if (myRequestId !== requestIdRef.current) return;
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.nextParam !== null);
      if (page.nextParam !== null) setParam(page.nextParam);
      setError(null);
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      if (myRequestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [search, hasMore, param]);

  useEffect(() => {
    if (items.length === 0 && hasMore && !loadingRef.current) {
      void loadMore();
    }
  }, [items.length, hasMore, search]);

  const insertSorted = useCallback((item: Item) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      const idx = prev.findIndex((p) => p.id > item.id);
      const copy = prev.slice();
      if (idx === -1) copy.push(item);
      else copy.splice(idx, 0, item);
      return copy;
    });
  }, []);

  const append = useCallback((item: Item) => {
    setItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]));
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorderLocal = useCallback((fromId: number, toIndex: number) => {
    setItems((prev) => {
      const fromIndex = prev.findIndex((p) => p.id === fromId);
      if (fromIndex === -1) return prev;
      const copy = prev.slice();
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, []);

  return { items, hasMore, loading, error, loadMore, insertSorted, append, removeItem, reorderLocal };
}
