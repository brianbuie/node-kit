import { describe, it } from 'node:test';
import assert from 'node:assert';
import { temp, Dir, type DirOptions } from './Dir.ts';

describe('Dir', () => {
  const testDir = temp.dir('dir-test');

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

  it('.tempDir returns temporary directory', () => {
    const sub = testDir.tempDir('example');
    assert(sub.isTemp);
  });

  it('.dir() makes relative paths', () => {
    assert(testDir.dir('/').path.includes(testDir.path));
  });

  it('Resolves filenames in folder', () => {
    const txt = testDir.filepath('test.txt');
    assert(txt.includes(testDir.path));
    assert(txt.includes('test.txt'));
  });

  it('is extendable and chains methods correctly', () => {
    const testRoot = testDir.tempDir('extendable').path;
    class Example extends Dir {
      dir(subPath: string, options: DirOptions = {}) {
        return new Example(subPath, options);
      }
    }
    const test = new Example(testRoot);
    const child = test.dir('child');
    assert(child instanceof Example);
    const childTemp = child.tempDir('temp-child');
    assert(childTemp instanceof Example);
  });
});
