export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const chr = content.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + '_' + content.length;
}

export function getCachedPack(key: string): unknown | null {
  try {
    const raw = localStorage.getItem('sw_cache_' + key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem('sw_cache_' + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCachedPack(key: string, data: unknown): void {
  try {
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('sw_cache_' + key, JSON.stringify({ data, expires }));
  } catch {
    /* quota exceeded */
  }
}
