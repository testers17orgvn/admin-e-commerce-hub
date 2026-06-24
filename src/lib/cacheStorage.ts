// Lightweight localStorage cache used as a buffer while DB data loads.
// Each entry: { v: <value>, t: <timestamp> }

const PREFIX = 'vsm_cache:';

export function cacheKey(key: string): string {
  return PREFIX + key;
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: T; t: number };
    return parsed?.v ?? null;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/** Clear all vsm_cache:* entries. Call after global resets. */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Subscribe to cache changes from other tabs via the `storage` event.
 * Returns an unsubscribe function. Fires with the parsed value (or null on remove).
 */
export function subscribeCache<T>(key: string, cb: (value: T | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const fullKey = PREFIX + key;
  const handler = (e: StorageEvent) => {
    if (e.key !== fullKey) return;
    if (!e.newValue) return cb(null);
    try {
      const parsed = JSON.parse(e.newValue) as { v: T; t: number };
      cb(parsed?.v ?? null);
    } catch {
      cb(null);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
