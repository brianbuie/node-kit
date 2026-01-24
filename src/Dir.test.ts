import { describe, it } from 'node:test';
import assert from 'node:assert';
import { temp, Dir, type DirOptions } from './Dir.ts';

describe('Dir', () => {
  const testDir = temp.dir('dir-test');
  testDir.clear();

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
    assert(testDir.dirs.length > 0);
  });

  it('.tempDir returns temporary directory', () => {
    const sub = testDir.tempDir('example');
    assert(sub.isTemp);
  });

  it('.dir() makes relative paths', () => {
    assert(testDir.dir('/').path.includes(testDir.path));
  });

  it('.isTemp flows down to child Dirs', () => {
    const base = testDir.tempDir('temp-by-default');
    const child = base.dir('child');
    assert(child.isTemp);
  });

  it('Resolves filenames in folder', () => {
    const txt = testDir.filepath('test.txt');
    assert(txt.includes(testDir.path));
    assert(txt.includes('test.txt'));
  });

  it('is extendable and chains methods correctly', () => {
    class Example extends Dir {
      get testFiles() {
        return this.files.filter(f => f.ext === '.test');
      }
    }
    const testRoot = testDir.tempDir('extendable');
    const test = new Example(testRoot.path);
    const child = test.dir('child');
    assert(child instanceof Example);
    const childFile = child.file('child.test');
    childFile.write('');
    assert(child.testFiles.map(f => f.path).includes(childFile.path));
    assert(test.dirs.map(d => d.path).includes(child.path));
    const childTemp = child.tempDir('temp-child');
    assert(childTemp instanceof Example);
    childTemp.file('child-temp').json({});
    assert(childTemp.jsonFiles.length === 1);
  });
});
