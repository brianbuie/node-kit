import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Dir, TempDir, temp } from './Dir.js';

describe('Dir', () => {
  const test = new Dir('test');

  it('Sanitizes filenames', () => {
    const name = test.sanitize(':/something/else.json');
    assert(!name.includes('/'));
    assert(!name.includes(':'));
  });

  it('Creates sub directories', () => {
    const subPath = 'sub/dir';
    const sub = test.subDir(subPath);
    assert(sub.path.includes(test.path));
    assert(sub.path.includes(subPath));
  });

  it('TempDir.subDir returns instance of TempDir', () => {
    const sub = temp.subDir('example');
    assert(sub instanceof TempDir);
  });

  it('Resolves filenames in folder', () => {
    const txt = temp.filepath('test.txt');
    assert(txt.includes(temp.path));
    assert(txt.includes('test.txt'));
  });
});
