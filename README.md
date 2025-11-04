[![NPM Version](https://img.shields.io/npm/v/%40brianbuie%2Fnode-kit)](https://www.npmjs.com/package/@brianbuie/node-kit)

# Node Kit

Basic tools for quick node.js projects

## Installing

```
npm add @brianbuie/node-kit
```

```js
import { thing } from '@brianbuie/node-kit';
```

## Features

### Fetcher

```ts
import { Fetcher } from '@brianbuie/node-kit';

// All requests will include Authorization header
const api = new Fetcher({
  base: 'https://www.example.com',
  headers: {
    Authorization: `Bearer ${process.env.EXAMPLE_SECRET}`,
  },
});

// GET https://www.example.com/route
// returns [Response, Request]
const [res] = await api.fetch('/route');

// GET https://www.example.com/other-route
// returns [string, Response, Request]
const [text] = await api.fetchText('/other-route');

// GET https://www.example.com/thing?page=1
// returns [Thing, Response, Request]
const [data] = await api.fetchJson<Thing>('/thing', { query: { page: 1 } });

// POST https://www.example.com/thing (data is sent as JSON in body)
// returns [Thing, Response, Request]
const [result] = await api.fetchJson<Thing>('/thing', { data: { example: 1 } });
```

### Jwt

Save a JSON Web Token in memory and reuse it throughout the process.

```js
import { Jwt, Fetcher } from '@brianbuie/node-kit';

const apiJwt = new Jwt({
  payload: {
    example: 'value',
  },
  options: {
    algorithm: 'HS256',
  },
  seconds: 60,
  key: process.env.JWT_KEY,
});

const api = new Fetcher({
  base: 'https://example.com',
  headers: {
    Authorization: `Bearer ${apiJwt.token}`,
  },
});
```

> TODO: expiration is not checked again when provided in a header

### Log

Chalk output in development, structured JSON when running in gcloud

```js
import { Log } from '@brianbuie/node-kit';

Log.info('message', { other: 'details' });

// Print in development, or if process.env.DEBUG or --debug argument is present
Log.debug('message', Response);

// Log details and throw
Log.error('Something happened', details, moreDetails);
```

### snapshot

Gets all enumerable and non-enumerable properties, so they can be included in JSON.stringify. Helpful for built-in objects, like Error, Request, Response, Headers, Map, etc.

```js
fs.writeFileSync('result.json', JSON.stringify(snapshot(response), null, 2));
```

## Publishing changes to this package

Commit all changes, then run:

```
npm version [patch|minor|major] [-m "custom commit message"]
```

- Bumps version in `package.json`
- Runs tests (`"preversion"` script in `package.json`)
- Creates new commit, tagged with version
- Pushes commit and tags to github (`"postversion"` script in `package.json`)
- The new tag will trigger github action to publish to npm (`.github/actions/publish.yml`)
