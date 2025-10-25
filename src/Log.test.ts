import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Log } from './Log.js';

describe('Log', () => {
  it('should throw error', () => {
    try {
      Log.error('Test error');
    } catch (e) {
      return;
    }
    assert(false, 'Did not throw error');
  });

  it('should recognize this is a test', () => {
    assert(Log.isTest);
  });

  it('should use first argument as message when string', () => {
    const result = Log.prepare('test', { something: 'else' });
    assert(result.message === 'test');
  });

  it('should use message prop when provided', () => {
    const result = Log.prepare({ message: 'test', something: 'else' });
    assert(result.message === 'test');
  });
});
