import { RefObject, useEffect, useRef } from 'react';

export function useInfiniteScrollSentinel(
  containerRef: RefObject<HTMLElement>,
  onIntersect: () => void,
  enabled: boolean
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersectRef.current();
      },
      { root: container, rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [containerRef, enabled]);

  return sentinelRef;
}
