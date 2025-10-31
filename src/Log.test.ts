import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Log } from './Log.js';

describe('Log', () => {
  it('Throws error', () => {
    try {
      Log.error('Test error');
    } catch (e) {
      return;
    }
    assert(false, 'Did not throw error');
  });

  it('Recognizes this is a test', () => {
    assert(Log.isTest);
  });

  it('Uses first argument as message when string', () => {
    const result = Log.prepare('test', { something: 'else' });
    assert(result.message === 'test');
  });

  it('Uses message prop when provided', () => {
    const result = Log.prepare({ message: 'test', something: 'else' });
    assert(result.message === 'test');
  });
});
