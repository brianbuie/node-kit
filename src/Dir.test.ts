import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { Dir, TempDir, temp } from './Dir.ts';

describe('Dir', () => {
  const testDir = temp.dir('dir-test');

  console.log(path.join('/dir1', '/dir2', 'dir3'));

  it('Sanitizes filenames', () => {
    const name = testDir.sanitize(':/something/else.json');
    assert(!name.includes('/'));
    assert(!name.includes(':'));
  });

  it('Creates sub directories', () => {
    const subPath = 'sub/dir';
    const sub = testDir.dir(subPath);
    assert(sub.path.includes(testDir.path));
    assert(sub.path.includes(subPath));
  });

  it('.tempDir returns instance of TempDir', () => {
    const sub = testDir.tempDir('example');
    assert(sub instanceof TempDir);
  });

  it('.dir() and .tempDir() make relative paths', () => {
    assert(testDir.dir('/').path.includes(testDir.path));
    assert(testDir.tempDir('/').path.includes(testDir.path));
  });

  it('Resolves filenames in folder', () => {
    const txt = testDir.filepath('test.txt');
    assert(txt.includes(testDir.path));
    assert(txt.includes('test.txt'));
  });
});
