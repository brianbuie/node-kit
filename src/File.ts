import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import mime from 'mime-types';
import { writeToStream, parseStream } from 'fast-csv';
import { snapshot } from './snapshot.ts';

/**
 * Represents a file on the file system. If the file doesn't exist, it is created the first time it is written to.
 */
export class File {
  path;
  root;
  dir;
  base;
  name;
  ext;
  type;

  constructor(filepath: string) {
    this.path = path.resolve(filepath);
    const { root, dir, base, ext, name } = path.parse(this.path);
    this.root = root;
    this.dir = dir;
    this.base = base;
    this.name = name;
    this.ext = ext;
    this.type = mime.lookup(ext) || undefined;
  }

  get exists() {
    return fs.existsSync(this.path);
  }

  get stats(): Partial<fs.Stats> {
    return this.exists ? fs.statSync(this.path) : {};
  }

  /**
   * Deletes the file if it exists
   */
  delete() {
    fs.rmSync(this.path, { force: true });
  }

  /**
   * @returns the contents of the file as a string, or undefined if the file doesn't exist
   */
  read() {
    return this.exists ? fs.readFileSync(this.path, 'utf8') : undefined;
  }

  /**
   * @returns lines as strings, removes trailing '\n'
   */
  lines() {
    const contents = (this.read() || '').split('\n');
    return contents.at(-1)?.length ? contents : contents.slice(0, contents.length - 1);
  }

  get readStream() {
    return this.exists ? fs.createReadStream(this.path) : Readable.from([]);
  }

  get writeStream() {
    fs.mkdirSync(this.dir, { recursive: true });
    return fs.createWriteStream(this.path);
  }

  write(contents: string | ReadableStream) {
    fs.mkdirSync(this.dir, { recursive: true });
    if (typeof contents === 'string') return fs.writeFileSync(this.path, contents);
    if (contents instanceof ReadableStream) return finished(Readable.from(contents).pipe(this.writeStream));
    throw new Error(`Invalid content type: ${typeof contents}`);
  }

  /**
   * creates file if it doesn't exist, appends string or array of strings as new lines.
   * File always ends with '\n', so contents don't need to be read before appending
   */
  append(lines: string | string[]) {
    if (!this.exists) this.write('');
    const contents = Array.isArray(lines) ? lines.join('\n') : lines;
    fs.appendFileSync(this.path, contents + '\n');
  }

  /**
   * @returns FileTypeJson adaptor for current File, adds '.json' extension if not present.
   * @example
   * const file = new File('./data').json({ key: 'val' }); // FileTypeJson<{ key: string; }>
   * console.log(file.path) // '/path/to/cwd/data.json'
   * file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
   * @example
   * const file = new File('./data').json<object>({ key: 'val' }); // FileTypeJson<object>
   * file.write({ something: 'else' }) // ✅ data is typed as object
   */
  json<T>(contents?: T) {
    return new FileTypeJson<T>(this.path, contents);
  }

  /**
   * @example
   * const file = new File.json('data.json', { key: 'val' }); // FileTypeJson<{ key: string; }>
   */
  static get json() {
    return FileTypeJson;
  }

  /**
   * @returns FileTypeNdjson adaptor for current File, adds '.ndjson' extension if not present.
   */
  ndjson<T extends object>(lines?: T | T[]) {
    return new FileTypeNdjson<T>(this.path, lines);
  }
  /**
   * @example
   * const file = new File.ndjson('log', { key: 'val' }); // FileTypeNdjson<{ key: string; }>
   * console.log(file.path) // /path/to/cwd/log.ndjson
   */
  static get ndjson() {
    return FileTypeNdjson;
  }

  /**
   * @returns FileTypeCsv adaptor for current File, adds '.csv' extension if not present.
   * @example
   * const file = await new File('a').csv([{ col: 'val' }, { col: 'val2' }]); // FileTypeCsv<{ col: string; }>
   * await file.write([ { col2: 'val2' } ]); // ❌ 'col2' doesn't exist on type { col: string; }
   * await file.write({ col: 'val' }); // ✅ Writes one row
   * await file.write([{ col: 'val2' }, { col: 'val3' }]); // ✅ Writes multiple rows
   */
  async csv<T extends object>(rows?: T[], keys?: (keyof T)[]) {
    const csvFile = new FileTypeCsv<T>(this.path);
    if (rows) await csvFile.write(rows, keys);
    return csvFile;
  }

  static get csv() {
    return FileTypeCsv;
  }
}

/**
 * A generic file adaptor, extended by specific file type implementations
 */
export class FileType {
  file;

  constructor(filepath: string, contents?: string) {
    this.file = new File(filepath);
    if (contents) this.file.write(contents);
  }

  get exists() {
    return this.file.exists;
  }

  get path() {
    return this.file.path;
  }

  delete() {
    this.file.delete();
  }
}

/**
 * A .json file that maintains data type when reading/writing.
 * > ⚠️ This is mildly unsafe, important/foreign json files should be validated at runtime!
 * @example
 * const file = new FileTypeJson('./data', { key: 'val' }); // FileTypeJson<{ key: string; }>
 * console.log(file.path) // '/path/to/cwd/data.json'
 * file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
 * @example
 * const file = new FileTypeJson<object>('./data', { key: 'val' }); // FileTypeJson<object>
 * file.write({ something: 'else' }) // ✅ data is typed as object
 */
export class FileTypeJson<T> extends FileType {
  constructor(filepath: string, contents?: T) {
    super(filepath.endsWith('.json') ? filepath : filepath + '.json');
    if (contents) this.write(contents);
  }

  read() {
    const contents = this.file.read();
    return contents ? (JSON.parse(contents) as T) : undefined;
  }

  write(contents: T) {
    this.file.write(JSON.stringify(snapshot(contents), null, 2));
  }
}

/**
 * New-line delimited json file (.ndjson)
 * @see https://jsonltools.com/ndjson-format-specification
 */
export class FileTypeNdjson<T extends object> extends FileType {
  constructor(filepath: string, lines?: T | T[]) {
    super(filepath.endsWith('.ndjson') ? filepath : filepath + '.ndjson');
    if (lines) this.append(lines);
  }

  append(lines: T | T[]) {
    this.file.append(
      Array.isArray(lines) ? lines.map((l) => JSON.stringify(snapshot(l))) : JSON.stringify(snapshot(lines)),
    );
  }

  lines() {
    return this.file.lines().map((l) => JSON.parse(l) as T);
  }
}

type Key<T extends object> = keyof T;

/**
 * Comma separated values (.csv).
 * Input rows as objects, keys are used as column headers
 */
export class FileTypeCsv<Row extends object> extends FileType {
  constructor(filepath: string) {
    super(filepath.endsWith('.csv') ? filepath : filepath + '.csv');
  }

  async write(rows: Row[], keys?: Key<Row>[]) {
    const headerSet = new Set<Key<Row>>();
    if (keys) {
      for (const key of keys) headerSet.add(key);
    } else {
      for (const row of rows) {
        for (const key in row) headerSet.add(key);
      }
    }
    const headers = Array.from(headerSet);
    const outRows = rows.map((row) => headers.map((key) => row[key]));
    return finished(writeToStream(this.file.writeStream, [headers, ...outRows]));
  }

  #parseVal(val: string) {
    if (val.toLowerCase() === 'false') return false;
    if (val.toLowerCase() === 'true') return true;
    if (val.length === 0) return null;
    if (/^[\.0-9]+$/.test(val)) return Number(val);
    return val;
  }

  async read() {
    return new Promise<Row[]>((resolve, reject) => {
      const parsed: Row[] = [];
      parseStream(this.file.readStream, { headers: true })
        .on('data', (raw: Record<Key<Row>, string>) => {
          parsed.push(
            Object.entries(raw).reduce(
              (all, [key, val]) => ({
                ...all,
                [key]: this.#parseVal(val as string),
              }),
              {} as Row,
            ),
          );
        })
        .on('error', (e) => reject(e))
        .on('end', () => resolve(parsed));
    });
  }
}
