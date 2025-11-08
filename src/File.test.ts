import { describe, it } from 'node:test';
import assert from 'node:assert';
import { temp } from './Dir.js';
import { File } from './File.js';

const testDir = temp.dir('file-test');
testDir.clear();

const thing = {
  a: 'string',
  b: 2,
  c: true,
  d: false,
  e: null,
};

describe('FileType', () => {
  it('Creates instances', () => {
    const test1 = new File.FileType(testDir.filepath('test1.txt'));
    assert(test1.file.path.includes('test1.txt'));
    const base = 'test2';
    const eg1 = new File.json(testDir.filepath(base));
    const eg2 = testDir.file(base).json();
    const eg3File = new File(testDir.filepath(base));
    const eg3 = eg3File.json();
    assert(eg1.path === eg2.path && eg2.path === eg3.path);
  });

  it('Deletes files', () => {
    const test = testDir.file('delete-test.txt');
    test.write('test');
    assert.equal(test.read(), 'test');
    test.delete();
    assert.equal(test.exists, false);
  });
});

describe('File.ndjson', () => {
  it('Appends new lines correctly', () => {
    const file = testDir.file('appends-lines').ndjson();
    file.delete();
    file.append([thing, thing]);
    assert(file.lines().length === 2);
    file.append(thing);
    assert(file.lines().length === 3);
    file.lines().forEach((line) => {
      assert.deepStrictEqual(line, thing);
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
    assert.deepStrictEqual(file.read(), thing);
    file.write(thing);
    assert.deepStrictEqual(file.read(), thing);
  });

  it('Does not create file when reading', () => {
    const file = testDir.file('test123').json();
    const contents = file.read();
    assert(contents === undefined);
    assert(!file.exists);
  });
});

describe('File.csv', () => {
  it('Saves data as csv', async () => {
    const things = [thing, thing, thing];
    const file = await testDir.file('csv-data').csv(things);
    const parsed = await file.read();
    parsed.forEach((row) => {
      assert.deepEqual(row, thing);
    });
  });
});
