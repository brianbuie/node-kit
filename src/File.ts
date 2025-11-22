import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { writeToString, parseString } from 'fast-csv';
import { snapshot } from './snapshot.js';

/**
 * WARNING: API will change!
 */
export class File {
  path;

  constructor(filepath: string) {
    this.path = filepath;
  }

  get exists() {
    return fs.existsSync(this.path);
  }

  delete() {
    fs.rmSync(this.path, { force: true });
  }

  read() {
    return this.exists ? fs.readFileSync(this.path, 'utf8') : undefined;
  }

  write(contents: string) {
    fs.mkdirSync(path.parse(this.path).dir, { recursive: true });
    fs.writeFileSync(this.path, contents);
  }

  async streamFrom(...options: Parameters<(typeof Readable)['from']>) {
    return finished(Readable.from(...options).pipe(fs.createWriteStream(this.path)));
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
   * @returns lines as strings, removes trailing '\n'
   */
  lines() {
    const contents = (this.read() || '').split('\n');
    return contents.slice(0, contents.length - 1);
  }

  static get FileType() {
    return FileType;
  }

  json<T>(contents?: T) {
    return new FileTypeJson<T>(this.path, contents);
  }

  static get json() {
    return FileTypeJson;
  }

  ndjson<T extends object>(lines?: T | T[]) {
    return new FileTypeNdjson<T>(this.path, lines);
  }

  static get ndjson() {
    return FileTypeNdjson;
  }

  async csv<T extends object>(rows?: T[], keys?: (keyof T)[]) {
    const csvFile = new FileTypeCsv<T>(this.path);
    if (rows) await csvFile.write(rows, keys);
    return csvFile;
  }

  static get csv() {
    return FileTypeCsv;
  }
}

export class FileType<T = string> {
  file;

  constructor(filepath: string, contents?: T) {
    this.file = new File(filepath);
    if (contents) {
      if (typeof contents !== 'string') {
        throw new Error('File contents must be a string');
      }
      this.file.write(contents);
    }
  }

  get exists() {
    return this.file.exists;
  }

  delete() {
    this.file.delete();
  }

  get path() {
    return this.file.path;
  }
}

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
    const contents = await writeToString([headers, ...outRows]);
    this.file.write(contents);
  }

  async read() {
    return new Promise<Row[]>((resolve, reject) => {
      const parsed: Row[] = [];
      const content = this.file.read();
      if (!content) return resolve(parsed);
      function parseVal(val: string) {
        if (val.toLowerCase() === 'false') return false;
        if (val.toLowerCase() === 'true') return true;
        if (val.length === 0) return null;
        if (/^[\.0-9]+$/.test(val)) return Number(val);
        return val;
      }
      parseString(content, { headers: true })
        .on('error', (e) => reject(e))
        .on('end', () => resolve(parsed))
        .on('data', (raw: Record<Key<Row>, string>) => {
          parsed.push(
            Object.entries(raw).reduce(
              (all, [key, val]) => ({
                ...all,
                [key]: parseVal(val as string),
              }),
              {} as Row,
            ),
          );
        });
    });
  }
}
