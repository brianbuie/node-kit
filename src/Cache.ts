import { temp } from './Dir.js';

const cacheDir = temp.dir('cache');

/**
 * Save results of a function in a temporary file.
 * @param key A unique name for the file
 * @param ttl cache duration in ms
 * @param getValue the function to populate the cache (eg. fetch results, generate key, etc)
 */
export class Cache<T> {
  file;
  ttl;
  getValue;

  constructor(key: string, ttl: number, getValue: () => T | Promise<T>) {
    this.file = cacheDir.file(key).json<{ createdAt: number; value: T }>();
    this.ttl = ttl;
    this.getValue = getValue;
  }

  async read() {
    const { createdAt, value } = this.file.read() || {};
    if (value && createdAt && createdAt + this.ttl > Date.now()) return value;
    return this.write();
  }

  async write() {
    const value = await this.getValue();
    this.file.write({ createdAt: Date.now(), value });
    return value;
  }
}
