import { type Duration, isAfter, add } from 'date-fns';
import { temp } from './Dir.js';

const cacheDir = temp.dir('cache');

/**
 * Save data to a local file with an expiration.
 * Fresh/stale data is returned with a flag for if it's fresh or not,
 * so stale data can still be used if needed.
 */
export class Cache<T> {
  file;
  ttl;

  constructor(key: string, ttl: number | Duration, initialData?: T) {
    this.file = cacheDir.file(key).json<{ savedAt: string; data: T }>();
    this.ttl = typeof ttl === 'number' ? { minutes: ttl } : ttl;
    if (initialData) this.write(initialData);
  }

  write(data: T) {
    this.file.write({ savedAt: new Date().toUTCString(), data });
  }

  read(): [T | undefined, boolean] {
    const { savedAt, data } = this.file.read() || {};
    const isFresh = Boolean(savedAt && isAfter(add(savedAt, this.ttl), new Date()));
    return [data, isFresh];
  }
}
