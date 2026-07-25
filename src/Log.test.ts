import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Log } from './Log.ts';

describe('Log', () => {
  function allLevels() {
    Log.trace('trace');
    Log.debug('debug');
    Log.info('info');
    Log.warn('warn');
    try {
      // Log.error('error', { err: new Error('error') });
    } catch (e) {}
    Log.fatal('fatal');
  }

  it('Logs for dev', () => {
    allLevels();
  });

  it('Logs for production', () => {
    Log.configure({ environment: 'production' });
    allLevels();
  });
});
