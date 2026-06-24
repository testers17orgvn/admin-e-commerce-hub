// Lightweight localStorage cache used as a buffer while DB data loads.
// Each entry: { v: <value>, t: <timestamp> }

const PREFIX = 'vsm_cache:';

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
