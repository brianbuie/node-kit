import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import mime from 'mime-types';
import { writeToStream, parseStream } from 'fast-csv';
import { default as probeImageSize, type ProbeResult } from 'probe-image-size';
import { Cmd } from './Cmd.ts';

/**
 * Represents a file on the file system. If the file doesn't exist, it is created the first time it is written to.
 */
export class File {
  path: string;
  root: string;
  dir: string;
  base: string;
  name: string;
  ext: string;
  type?: string;

  constructor(filepath: string) {
    this.path = this.#resolve(filepath);
    const { root, dir, base, ext, name } = path.parse(this.path);
    this.root = root;
    this.dir = dir;
    this.base = base;
    this.name = name;
    this.ext = ext;
    this.type = mime.lookup(ext) || undefined;
  }

  #resolve(filepath: string): string {
    if (filepath[0] === '~') {
      if (process.env.HOME) {
        return path.join(process.env.HOME, filepath.slice(1));
      } else {
        console.warn('process.env.HOME does not exist! "~" will not resolve to home directory');
      }
    }
    return path.resolve(filepath);
  }

  get exists(): boolean {
    return fs.existsSync(this.path);
  }

  get stats(): Partial<fs.Stats> {
    return this.exists ? fs.statSync(this.path) : {};
  }

  /**
   * Deletes the file if it exists
   */
  delete(): void {
    fs.rmSync(this.path, { force: true });
  }

  /**
   * @returns the contents of the file as a string, or undefined if the file doesn't exist
   */
  read(): string | undefined {
    return this.exists ? fs.readFileSync(this.path, 'utf8') : undefined;
  }

  /**
   * @returns lines as strings, removes trailing '\n'
   */
  lines(): string[] {
    const contents = (this.read() || '').split('\n');
    return contents.at(-1)?.length ? contents : contents.slice(0, contents.length - 1);
  }

  get readStream(): fs.ReadStream | Readable {
    return this.exists ? fs.createReadStream(this.path) : Readable.from([]);
  }

  get writeStream(): fs.WriteStream {
    fs.mkdirSync(this.dir, { recursive: true });
    return fs.createWriteStream(this.path);
  }

  write(contents: string | ReadableStream): void | Promise<void> {
    fs.mkdirSync(this.dir, { recursive: true });
    if (typeof contents === 'string') return fs.writeFileSync(this.path, contents);
    if (contents instanceof ReadableStream) return finished(Readable.from(contents).pipe(this.writeStream));
    throw new Error(`Invalid content type: ${typeof contents}`);
  }

  /**
   * creates file if it doesn't exist, appends string or array of strings as new lines.
   * File always ends with '\n', so contents don't need to be read before appending
   */
  append(lines: string | string[]): void {
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
  json<T>(contents?: T): FileTypeJson<T> {
    return new FileTypeJson<T>(this.path, contents);
  }

  /**
   * @example
   * const file = new File.json('data.json', { key: 'val' }); // FileTypeJson<{ key: string; }>
   */
  static get json(): typeof FileTypeJson {
    return FileTypeJson;
  }

  /**
   * @returns FileTypeNdjson adaptor for current File, adds '.ndjson' extension if not present.
   */
  ndjson<T extends object>(lines?: T | T[]): FileTypeNdjson<T> {
    return new FileTypeNdjson<T>(this.path, lines);
  }
  /**
   * @example
   * const file = new File.ndjson('log', { key: 'val' }); // FileTypeNdjson<{ key: string; }>
   * console.log(file.path) // /path/to/cwd/log.ndjson
   */
  static get ndjson(): typeof FileTypeNdjson {
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
  async csv<T extends object>(rows?: T[], options?: FileTypeCsvOptions<T>): Promise<FileTypeCsv<T>> {
    const csvFile = new FileTypeCsv<T>(this.path, options);
    if (rows) await csvFile.write(rows);
    return csvFile;
  }

  static get csv(): typeof FileTypeCsv {
    return FileTypeCsv;
  }

  async image(content?: ReadableStream) {
    const imageFile = new FileTypeImage(this.path);
    if (content) await imageFile.file.write(content);
    return imageFile;
  }

  static get image(): typeof FileTypeImage {
    return FileTypeImage;
  }

  async video(content?: ReadableStream) {
    const videoFile = new FileTypeVideo(this.path);
    if (content) await videoFile.file.write(content);
    return videoFile;
  }

  static get video(): typeof FileTypeVideo {
    return FileTypeVideo;
  }
}

/**
 * A generic file adaptor, extended by specific file type implementations
 */
export class FileType {
  file: File;

  constructor(filepath: string, contents?: string) {
    this.file = new File(filepath);
    if (contents) this.file.write(contents);
  }

  get path(): string {
    return this.file.path;
  }

  get root(): string {
    return this.file.root;
  }

  get dir(): string {
    return this.file.dir;
  }

  get base(): string {
    return this.file.base;
  }

  get name(): string {
    return this.file.name;
  }

  get ext(): string {
    return this.file.ext;
  }

  get type(): string | undefined {
    return this.file.type;
  }

  get exists(): boolean {
    return this.file.exists;
  }

  get stats(): Partial<fs.Stats> {
    return this.file.stats;
  }

  delete(): void {
    this.file.delete();
  }

  get readStream(): fs.ReadStream | Readable {
    return this.file.readStream;
  }

  get writeStream(): fs.WriteStream {
    return this.file.writeStream;
  }
}

/**
 * A .json file that maintains data type when reading/writing.
 * > ⚠️ This is mildly unsafe, json files should be validated at runtime!
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

  read(): T | undefined {
    const contents = this.file.read();
    return contents ? (JSON.parse(contents) as T) : undefined;
  }

  write(contents: T): void {
    this.file.write(JSON.stringify(contents, null, 2));
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

  append(lines: T | T[]): void {
    this.file.append(Array.isArray(lines) ? lines.map(l => JSON.stringify(l)) : JSON.stringify(lines));
  }

  lines(): T[] {
    return this.file.lines().map(l => JSON.parse(l) as T);
  }
}

type Key<T extends object> = keyof T;

type FileTypeCsvOptions<Row extends object> = {
  parseNumbers?: boolean;
  parseBooleans?: boolean;
  parseNulls?: boolean;
  keys?: Key<Row>[];
};

/**
 * Comma separated values (.csv).
 * Input rows as objects, keys are used as column headers
 */
export class FileTypeCsv<Row extends object> extends FileType {
  options: FileTypeCsvOptions<Row>;

  constructor(filepath: string, options: FileTypeCsvOptions<Row> = {}) {
    super(filepath.endsWith('.csv') ? filepath : filepath + '.csv');
    this.options = {
      parseNumbers: true,
      parseBooleans: true,
      parseNulls: true,
      ...options,
    };
  }

  async write(rows: Row[]): Promise<void> {
    const headerSet = new Set<Key<Row>>();
    if (this.options.keys) {
      for (const key of this.options.keys) headerSet.add(key);
    } else {
      for (const row of rows) {
        for (const key in row) headerSet.add(key);
      }
    }
    const headers = Array.from(headerSet);
    const outRows = rows.map(row => headers.map(key => row[key]));
    return finished(writeToStream(this.file.writeStream, [headers, ...outRows]));
  }

  #parseVal(val: string): string | number | boolean | null {
    const { parseNumbers, parseBooleans, parseNulls } = this.options;
    if (parseBooleans && val.toLowerCase() === 'false') return false;
    if (parseBooleans && val.toLowerCase() === 'true') return true;
    if (parseNulls && (val.length === 0 || val.toLowerCase() === 'null')) return null;
    if (parseNumbers && /^[\.0-9]+$/.test(val)) return Number(val);
    return val;
  }

  async read(): Promise<Row[]> {
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
        .on('error', e => reject(e))
        .on('end', () => resolve(parsed));
    });
  }
}

export class FileTypeImage extends FileType {
  async dimensions(): Promise<{
    width: number;
    height: number;
  }> {
    return probeImageSize(this.file.readStream);
  }
}

export class FileTypeVideo extends FileType {
  async dimensions(): Promise<{
    width: number;
    height: number;
    duration: number;
  }> {
    return Cmd.ffprobe(`-select_streams v:0 -show_entries stream -of json "${this.file.path}"`).then(out => {
      const { streams } = JSON.parse(out) as {
        streams: { width: number; height: number; duration: string }[];
      };
      if (!streams[0]) throw new Error('Could not parse video stream');
      return { ...streams[0], duration: Number(streams[0].duration) };
    });
  }
}
