import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Fetcher } from './Fetcher.js';

describe('Fetcher', () => {
  const statusApi = new Fetcher({ base: 'https://mock.httpstatus.io' });

  it('should make URL', () => {
    const route = '/example/route';
    const [url] = statusApi.buildUrl(route);
    assert(url.href.includes(route));
  });

  it('should throw when URL is invalid', () => {
    try {
      const empty = new Fetcher();
      empty.buildUrl('/');
    } catch (e) {
      return;
    }
    throw new Error('Ignored invalid URL');
  });

  it('should identify the correct domain', () => {
    const test = new Fetcher({ base: 'https://subdomain.example.org' });
    const [_, domain] = test.buildUrl('');
    assert(domain === 'example.org');
  });

  it('should handle query parameters', () => {
    const [url] = statusApi.buildUrl('/', { query: { key: 'value' } });
    assert(url.href.includes('?key=value'));
  });

  it('should handle undefined query params', () => {
    const [url] = statusApi.buildUrl('/', { query: { key: undefined } });
    assert(!url.href.includes('key'));
  });

  it('should keep falsey query params', () => {
    const [url] = statusApi.buildUrl('/', { query: { zero: 0, false: false, null: null } });
    assert(url.href.includes('zero=0'));
    assert(url.href.includes('false=false'));
    assert(url.href.includes('null=null'));
  });

  it('should handle no query params', () => {
    const route = '/';
    const [url] = statusApi.buildUrl(route);
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
