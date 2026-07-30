import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Log } from './Log.ts';

describe('Log', () => {
  const details = {
    num: 1,
    str: 'string detail',
  };
  function allLevels() {
    Log.trace('trace');
    Log.debug('debug');
    Log.info('info', details);
    Log.info(details);
    Log.info([1, 2, 3]);
    Log.warn('warn');
    try {
      throw new Error('Test error');
    } catch (err) {
      Log.error({ err });
    }
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
