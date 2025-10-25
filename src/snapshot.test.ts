import { describe, it } from 'node:test';
import assert from 'node:assert';
import { snapshot } from './snapshot.js';

describe('snapshot', () => {
  it('should capture Error details', () => {
    try {
      throw new Error('Test Error');
    } catch (e) {
      const result = snapshot(e) as Error;
      assert(result.message !== undefined);
      assert(result.stack !== undefined);
    }
  });

  it('should capture Map values', () => {
    const test = new Map<string, string>();
    test.set('key', 'value');
    const shot = JSON.parse(JSON.stringify(snapshot(test))) as Record<string, string>;
    assert(shot.key === 'value');
  });

  it('should capture Request values', () => {
    const test = new Request('https://www.google.com', { headers: { example: 'value' } });
    const shot = JSON.parse(JSON.stringify(snapshot(test))) as Record<string, any>;
    assert(shot.url !== undefined);
    assert(shot.headers.example === 'value');
  });

  it('should ignore functions', () => {
    const test = { func: () => null };
    const shot = snapshot(test) as Record<string, any>;
    assert(shot.func === undefined);
  });
});
