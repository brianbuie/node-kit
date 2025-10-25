import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Fetcher } from './Fetcher.js';

describe('Fetcher', () => {
  const statusApi = new Fetcher({ base: 'https://mock.httpstatus.io' });

  it('should make URL', () => {
    const route = '/example/route';
    const url = statusApi.makeUrl(route);
    assert(url.href.includes(route));
  });

  it('should throw when no base', () => {
    try {
      const empty = new Fetcher();
      empty.makeUrl('/');
    } catch (e) {
      return;
    }
    throw new Error('Ignored invalid URL');
  });

  it('should handle query parameters', () => {
    const url = statusApi.makeUrl('/', { key: 'value' });
    assert(url.href.includes('?key=value'));
  });

  it('should handle undefined query params', () => {
    const url = statusApi.makeUrl('/', { key: undefined });
    assert(!url.href.includes('key'));
  });

  it('should handle no query params', () => {
    const route = '/';
    const url = statusApi.makeUrl(route);
    assert(url.href === statusApi.defaultOptions.base + route);
  });

  it('should throw on bad request', async () => {
    try {
      await statusApi.fetch('/404', { retries: 0 });
    } catch (e) {
      return;
    }
    throw new Error('Ignored bad request');
  });
});
