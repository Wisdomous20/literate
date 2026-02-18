"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global in-memory cache store (persists across component mounts during session)
const cacheStore = new Map<string, CacheEntry<unknown>>();

// Default TTL: 2 minutes
const DEFAULT_TTL_MS = 2 * 60 * 1000;

/**
 * Get a cached value if it exists and hasn't expired.
 */
export function getCached<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Set a value in the cache.
 */
export function setCache<T>(key: string, data: T): void {
  cacheStore.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix: string, prefix = false): void {
  if (prefix) {
    for (const key of cacheStore.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        cacheStore.delete(key);
      }
    }
  } else {
    cacheStore.delete(keyOrPrefix);
  }
}

/**
 * React hook for cached data fetching with stale-while-revalidate semantics.
 *
 * - Returns cached data instantly on mount (no loading flash)
 * - Revalidates in the background if the cache is older than half the TTL
 * - Supports manual refetch and cache invalidation
 *
 * @param key - Unique cache key
 * @param fetcher - Async function that fetches the data
 * @param options - TTL in ms (default 2 min), enabled flag
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; enabled?: boolean }
) {
  const { ttlMs = DEFAULT_TTL_MS, enabled = true } = options ?? {};
  const cached = enabled ? getCached<T>(key, ttlMs) : null;
  const [data, setData] = useState<T | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached && enabled);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current();
        if (isMountedRef.current) {
          setCache(key, result);
          setData(result);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [key]
  );

  // On mount or key change: serve cached data immediately, revalidate in background if stale
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      // Serve stale data immediately
      setData(entry.data as T);
      setIsLoading(false);

      // Background revalidate if past half the TTL
      const age = Date.now() - entry.timestamp;
      if (age > ttlMs / 2) {
        fetchData(false);
      }
    } else {
      setData(null);
      fetchData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  /**
   * Force refetch, bypassing cache.
   */
  const refetch = useCallback(async () => {
    invalidateCache(key);
    await fetchData(true);
  }, [key, fetchData]);

  return { data, isLoading, error, refetch };
}