// js/cache.js — KiNance In-Memory Cache
const _store = new Map();

export function setCache(key, data) {
  _store.set(key, { data, ts: Date.now() });
}

export function getCache(key, ttl = 60_000) {
  const entry = _store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) { _store.delete(key); return null; }
  return entry.data;
}

export function clearCache(key) {
  if (key) _store.delete(key);
  else _store.clear();
}
