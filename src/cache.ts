export interface CacheOptions {
  ttl: number;
  maxSize?: number;
}

export class SDKCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private keyOrder: string[] = [];
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions) {
    this.ttl = options.ttl;
    this.maxSize = options.maxSize || 100;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.keyOrder = this.keyOrder.filter((k) => k !== key);
      return null;
    }

    return item.value as T;
  }

  set(key: string, value: any): void {
    if (this.cache.has(key)) {
      this.keyOrder = this.keyOrder.filter((k) => k !== key);
    }

    if (this.cache.size >= this.maxSize && this.keyOrder.length > 0) {
      const oldestKey = this.keyOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.keyOrder.push(key);

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear(): void {
    this.cache.clear();
    this.keyOrder = [];
  }
}

export const defaultCache = new SDKCache({ ttl: 60000 });
