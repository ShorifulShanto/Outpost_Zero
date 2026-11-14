const memoryCache = new Map<string, { storedAt: number; data: unknown }>();

const CACHE_PREFIX = 'outpost_zero_nasa_cache_v1_';

export function readNasaCache<T>(
  key: string,
  ttlMs: number
): { data: T; cachedAtIso: string } | null {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const now = Date.now();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(fullKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { storedAt?: unknown; data?: unknown };
        if (
          parsed &&
          typeof parsed.storedAt === 'number' &&
          now - parsed.storedAt <= ttlMs &&
          parsed.data !== undefined
        ) {
          return {
            data: parsed.data as T,
            cachedAtIso: new Date(parsed.storedAt).toISOString(),
          };
        }
      }
    }
  } catch {
    // Ignore storage read issues and fall back to memory cache
  }

  const memEntry = memoryCache.get(fullKey);
  if (memEntry && now - memEntry.storedAt <= ttlMs) {
    return {
      data: memEntry.data as T,
      cachedAtIso: new Date(memEntry.storedAt).toISOString(),
    };
  }

  return null;
}

export function writeNasaCache<T>(key: string, data: T): string {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const now = Date.now();
  memoryCache.set(fullKey, { storedAt: now, data });

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        fullKey,
        JSON.stringify({ storedAt: now, data })
      );
    }
  } catch {
    // Ignore storage quota / private mode errors
  }

  return new Date(now).toISOString();
}

export function clearNasaCache(): void {
  memoryCache.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {
    // Ignore
  }
}

export function sanitizeSafeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getNasaApiKey(): string {
  try {
    const env = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    )?.env;
    const key = env?.VITE_NASA_API_KEY?.trim();
    return key && key.length > 0 ? key : 'DEMO_KEY';
  } catch {
    return 'DEMO_KEY';
  }
}
