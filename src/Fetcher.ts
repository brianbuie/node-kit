import { merge } from 'lodash-es';

export type Route = string | URL;

export type Query = Record<string, string | number | boolean | undefined>;

export type FetchOptions = RequestInit & {
  base?: string;
  query?: Query;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
};

/**
 * Fetcher provides a quick way to set up a basic API connection
 * with options applied to every request
 * Includes basic methods for requesting and parsing responses
 */
export class Fetcher {
  defaultOptions;

  constructor(opts: FetchOptions = {}) {
    const defaultOptions = {
      timeout: 60000,
      retries: 3,
      retryDelay: 3000,
    };
    this.defaultOptions = merge(defaultOptions, opts);
  }

  makeUrl(route: Route, query: Query = {}) {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([_k, val]) => Boolean(val))
        .map(([key, val]) => [key, `${val}`])
    ).toString();
    const search = params ? '?' + params : '';
    return new URL(route + search, this.defaultOptions.base);
  }

  /**
   * Builds and performs the request, merging provided options with defaultOptions
   * If `opts.data` is provided, method is updated to POST, content-type json, data is stringified in the body
   * Retries on local or network error, with increasing backoff
   */
  async fetch(route: Route, opts: FetchOptions = {}): Promise<[Response, Request]> {
    const { query, data, timeout, retries, ...o } = merge({}, this.defaultOptions, opts);
    if (data) {
      o.headers = o.headers || {};
      o.headers['content-type'] = o.headers['content-type'] || 'application/json';
      o.method = o.method || 'POST';
      o.body = JSON.stringify(data);
    }
    const url = this.makeUrl(route, query);

    const attempts = retries + 1;
    let attempted = 0;
    while (attempted < attempts) {
      attempted++;
      const req = new Request(url, { ...o, signal: AbortSignal.timeout(timeout) });
      const res = await fetch(req)
        .then(r => {
          if (!r.ok) throw new Error(r.statusText);
          return r;
        })
        .catch(async error => {
          if (attempted < attempts) {
            const wait = attempted * 3000;
            console.warn(`Fetcher (attempt ${attempted} of ${attempts})`, error);
            await new Promise(resolve => setTimeout(resolve, wait));
          }
        });
      if (res) return [res, req];
    }
    throw new Error(`Failed to fetch ${url.href}`);
  }

  async fetchText(route: Route, opts: FetchOptions = {}): Promise<[string, Response, Request]> {
    return this.fetch(route, opts).then(async ([res, req]) => {
      const text = await res.text();
      return [text, res, req];
    });
  }

  async fetchJson<T>(route: Route, opts: FetchOptions = {}): Promise<[T, Response, Request]> {
    return this.fetchText(route, opts).then(([txt, res, req]) => [JSON.parse(txt) as T, res, req]);
  }
}
