import { temp } from './Dir.js';

const cacheDir = temp.subDir('cache');

export class Cache<T> {
  file;
  ttl;
  refresh;

  constructor(key: string, ttl: number, refresh: () => T | Promise<T>) {
    this.file = cacheDir.file(key).json<{ createdAt: number; value: T }>();
    this.ttl = ttl;
    this.refresh = refresh;
  }

  async read() {
    const { createdAt, value } = this.file.read() || {};
    if (value && createdAt && createdAt + this.ttl > Date.now()) return value;
    return this.write();
  }

  async write() {
    const value = await this.refresh();
    this.file.write({ createdAt: Date.now(), value });
    return value;
  }
}
