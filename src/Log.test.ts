import { describe, it } from 'node:test';
import { Log } from './Log.ts';

describe('Log', () => {
  const details = {
    num: 1,
    str: 'string detail',
  };

  function allLevels() {
    Log.trace('trace');
    console.log('');
    Log.debug('debug');
    console.log('');
    Log.info('info', details);
    console.log('');
    Log.info(details);
    console.log('');
    Log.info({ arr: [1, 2, 3] });
    console.log('');
    Log.warn('warn');
    console.log('');
    try {
      throw new Error('Test error');
    } catch (err) {
      Log.error(err);
      console.log('');
    }
    Log.alert('This is an alert');
    console.log('');
  }

  allLevels();

  Log.isProd = true;
  allLevels();

  Log.isGcloud = true;
  allLevels();
});
