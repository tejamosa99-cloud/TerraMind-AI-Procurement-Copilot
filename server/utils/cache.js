export class TtlCache {
  constructor({ ttlMs, maxEntries = 200 }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt >= this.ttlMs) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.prune();
    if (this.entries.size >= this.maxEntries) this.entries.delete(this.entries.keys().next().value);
    this.entries.set(key, { createdAt: Date.now(), value });
  }

  prune() {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (now - entry.createdAt >= this.ttlMs) this.entries.delete(key);
    }
  }
}
