import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isEqual } from 'lodash-es';
import { temp } from './Dir.js';
import { File } from './File.js';

const testDir = temp.subDir('file-test');
testDir.clear();

const thing = {
  a: 'string',
  b: 2,
  c: true,
  d: null,
};

describe('FileAdaptor', () => {
  it('Instances can be created', () => {
    const test1 = new File.Adaptor(testDir.filepath('test1.txt'));
    assert(test1.file.path.includes('test1.txt'));

    const base = 'test2';
    const eg1 = new File.json(testDir.filepath(base));
    const eg2 = testDir.file(base).json();
    const eg3File = new File(testDir.filepath(base));
    const eg3 = eg3File.json();
    assert(eg1.path === eg2.path && eg2.path === eg3.path);
  });
});

describe('File.ndjson', () => {
  it('Appends new lines correctly', () => {
    const file = testDir.file('empty-lines').ndjson();
    file.append([thing, thing]);
    assert(file.lines().length === 2);
    file.append(thing);
    assert(file.lines().length === 3);
    file.lines().forEach((line) => {
      assert(isEqual(line, thing));
    });
  });

  it('Adds file extension when needed', () => {
    const test = testDir.file('test').ndjson();
    assert(test.path.includes(testDir.path));
    assert(test.path.includes('.ndjson'));
    const test2 = testDir.file('test2').ndjson();
    assert(!test2.path.includes('.ndjson.ndjson'));
  });
});

describe('File.json', () => {
  it('Saves data as json', () => {
    const file = testDir.file('jsonfile-data').json(thing);
    assert(isEqual(file.read(), thing));
    file.write(thing);
    assert(isEqual(file.read(), thing));
  });

  it('Does not create file when reading', () => {
    const file = testDir.file('test123').json();
    const contents = file.read();
    assert(contents === undefined);
    assert(!file.exists);
  });
});
