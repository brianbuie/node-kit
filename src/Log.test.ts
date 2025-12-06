import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Log } from './Log.ts';

describe('Log', () => {
  it('Uses first argument as message when string', () => {
    const result = Log.prepare('test', { something: 'else' });
    assert(result.message === 'test');
  });

  it('Uses message prop when provided', () => {
    const result = Log.prepare({ message: 'test', something: 'else' });
    assert(result.message === 'test');
  });
});
