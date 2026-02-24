"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global in-memory cache store (persists across component mounts during session)
const cacheStore = new Map<string, CacheEntry<unknown>>();

// Default TTL: 1 day
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// Maximum cache size (for in-memory cache)
const MAX_CACHE_SIZE = 100;

/**
 * Save data to localStorage.
 */
function saveToLocalStorage<T>(key: string, data: T): void {
  const entry = { data, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
}

/**
 * Load data from localStorage.
 */
function loadFromLocalStorage<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null; // Return null if localStorage is not available
  }

  const stored = localStorage.getItem(key);
  if (!stored) return null;

  const entry: CacheEntry<T> = JSON.parse(stored);
  if (Date.now() - entry.timestamp > ttlMs) {
    localStorage.removeItem(key); // Remove expired entry
    return null;
  }
  return entry.data;
}

/**
 * Enforce cache size limit (LRU eviction).
 */
function enforceCacheSize() {
  while (cacheStore.size > MAX_CACHE_SIZE) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey !== undefined) {
      cacheStore.delete(oldestKey);
    }
  }
}

/**
 * Get a cached value if it exists and hasn't expired.
 * Now supports both in-memory and localStorage.
 */
export function getCached<T>(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS,
): T | null {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (entry) {
    if (Date.now() - entry.timestamp > ttlMs) {
      cacheStore.delete(key);
      return null;
    }
    return entry.data;
  }

  // Fallback to localStorage
  const local = loadFromLocalStorage<T>(key, ttlMs);
  return local;
}

/**
 * Set a value in the cache.
 * Now saves to both in-memory and localStorage.
 */
export function setCache<T>(key: string, data: T): void {
  cacheStore.set(key, { data, timestamp: Date.now() });
  enforceCacheSize(); // Ensure cache size limit
  saveToLocalStorage(key, data); // Save to localStorage
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 * Now removes data from both in-memory and localStorage.
 */
export function invalidateCache(keyOrPrefix: string, prefix = false): void {
  if (prefix) {
    for (const key of cacheStore.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        cacheStore.delete(key);
        localStorage.removeItem(key);
      }
    }
  } else {
    cacheStore.delete(keyOrPrefix);
    localStorage.removeItem(keyOrPrefix);
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
 * @param options - TTL in ms (default 1 day), enabled flag
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; enabled?: boolean },
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
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred",
          );
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [key],
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
