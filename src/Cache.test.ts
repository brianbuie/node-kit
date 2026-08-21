import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Cache } from './Cache.ts';
import { temp } from './Dir.ts';

describe('Cache', () => {
  it('uses an explicitly provided directory', () => {
    const dir = temp.tempDir('cache-test');
    const cache = new Cache<string>({ key: 'value', ttl: 5, path: dir.path });

    cache.write('cached');

    assert.equal(cache.file.path, dir.filepath('value.json'));
    assert.deepEqual(cache.read(), ['cached', true]);
  });
});
