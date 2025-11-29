import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Dir, TempDir, temp } from './Dir.ts';

describe('Dir', () => {
  const testDir = temp().dir('dir-test');

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
    const sub = temp().tempDir('example');
    assert(sub instanceof TempDir);
  });

  it('.dir() and .tempDir() throw on absolute path input', () => {
    const t = temp();
    assert.throws(() => {
      t.dir(t.path);
    });
    assert.throws(() => {
      t.tempDir(t.path);
    });
  });

  it('Resolves filenames in folder', () => {
    const txt = temp().filepath('test.txt');
    assert(txt.includes(temp().path));
    assert(txt.includes('test.txt'));
  });
});
