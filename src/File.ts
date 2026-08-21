import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable, Writable } from 'node:stream';
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

  #resolve = (filepath: string): string => {
    if (filepath.startsWith('~')) {
      if (!process.env.HOME) throw new Error("Can't resolve process.env.HOME for '~' in path.");
      return path.join(process.env.HOME, filepath.slice(1));
    }
    return path.resolve(filepath);
  };

  prepareWrite = () => {
    fs.mkdirSync(this.dir, { recursive: true });
  };

  get exists(): boolean {
    return fs.existsSync(this.path);
  }

  get stats(): Partial<fs.Stats> {
    return this.exists ? fs.statSync(this.path) : {};
  }

  get readable(): Readable {
    return this.exists ? fs.createReadStream(this.path) : Readable.from([]);
  }

  get writable(): Writable {
    this.prepareWrite();
    return fs.createWriteStream(this.path);
  }

  /**
   * Deletes the file if it exists
   */
  delete = (): void => {
    fs.rmSync(this.path, { force: true });
  };

  /**
   * @returns the contents of the file as a string, or undefined if the file doesn't exist
   */
  readText = (): string | undefined => {
    return this.exists ? fs.readFileSync(this.path, 'utf8') : undefined;
  };

  writeText = (contents: string): void => {
    this.prepareWrite();
    fs.writeFileSync(this.path, contents);
  };

  /**
   * @returns lines as strings, removes trailing '\n'
   */
  readTextLines = (): string[] => {
    const contents = (this.readText() || '').split('\n');
    return contents.at(-1)?.length ? contents : contents.slice(0, contents.length - 1);
  };

  /**
   * creates file if it doesn't exist, appends string or array of strings as new lines.
   * File always ends with '\n', so contents don't need to be read before appending
   */
  appendTextLines = (lines: string | string[]): void => {
    if (!this.exists) this.writeText('');
    const contents = Array.isArray(lines) ? lines.join('\n') : lines;
    fs.appendFileSync(this.path, contents + '\n');
  };

  writeStream = async (contents: ReadableStream): Promise<void> => {
    return finished(Readable.from(contents).pipe(this.writable));
  };

  /**
   * @returns FileJson adaptor for current File, adds '.json' extension if not present.
   * @example
   * const file = new File('./data').json({ key: 'val' }); // FileJson<{ key: string; }>
   * console.log(file.path) // '/path/to/cwd/data.json'
   * file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
   * @example
   * const file = new File('./data').json<object>({ key: 'val' }); // FileJson<object>
   * file.write({ something: 'else' }) // ✅ data is typed as object
   */
  json = <T>(contents?: T): FileJson<T> => {
    const jsonFile = new FileJson<T>(this.path);
    if (contents) jsonFile.write(contents);
    return jsonFile;
  };

  static get json(): typeof FileJson {
    return FileJson;
  }

  /**
   * @returns FileNdjson adaptor for current File, adds '.ndjson' extension if not present.
   */
  ndjson = <T extends object>(lines?: T | T[]): FileNdjson<T> => {
    const ndjsonFile = new FileNdjson<T>(this.path);
    if (lines) ndjsonFile.append(lines);
    return ndjsonFile;
  };

  static get ndjson(): typeof FileNdjson {
    return FileNdjson;
  }

  /**
   * @returns FileCsv adaptor for current File, adds '.csv' extension if not present.
   * @example
   * const file = await new File('a').csv([{ col: 'val' }, { col: 'val2' }]); // FileCsv<{ col: string; }>
   * await file.write([ { col2: 'val2' } ]); // ❌ 'col2' doesn't exist on type { col: string; }
   * await file.write({ col: 'val' }); // ✅ Writes one row
   * await file.write([{ col: 'val2' }, { col: 'val3' }]); // ✅ Writes multiple rows
   */
  csv = async <T extends object>(rows?: T[], options?: FileCsvOptions<T>): Promise<FileCsv<T>> => {
    const csvFile = new FileCsv<T>(this.path, options);
    if (rows) await csvFile.write(rows);
    return csvFile;
  };

  static get csv(): typeof FileCsv {
    return FileCsv;
  }

  image = async (stream?: ReadableStream): Promise<FileImage> => {
    const imageFile = new FileImage(this.path);
    if (stream) await imageFile.writeStream(stream);
    return imageFile;
  };

  static get image(): typeof FileImage {
    return FileImage;
  }

  video = async (stream?: ReadableStream): Promise<FileVideo> => {
    const videoFile = new FileVideo(this.path);
    if (stream) await videoFile.writeStream(stream);
    return videoFile;
  };

  static get video(): typeof FileVideo {
    return FileVideo;
  }
}

/**
 * A .json file that maintains data type when reading/writing.
 * > ⚠️ This is mildly unsafe, json files should be validated at runtime!
 * @example
 * const file = new FileJson('./data', { key: 'val' }); // FileJson<{ key: string; }>
 * console.log(file.path) // '/path/to/cwd/data.json'
 * file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
 * @example
 * const file = new FileJson<object>('./data', { key: 'val' }); // FileJson<object>
 * file.write({ something: 'else' }) // ✅ data is typed as object
 */
export class FileJson<T> extends File {
  constructor(filepath: string) {
    super(filepath.endsWith('.json') ? filepath : filepath + '.json');
  }

  read = (): T | undefined => {
    const contents = this.readText();
    return contents ? (JSON.parse(contents) as T) : undefined;
  };

  write = (contents: T): void => {
    this.writeText(JSON.stringify(contents, null, 2));
  };
}

/**
 * New-line delimited json file (.ndjson)
 * @see https://jsonltools.com/ndjson-format-specification
 */
export class FileNdjson<T extends object> extends File {
  constructor(filepath: string) {
    super(filepath.endsWith('.ndjson') ? filepath : filepath + '.ndjson');
  }

  append = (lines: T | T[]): void => {
    this.appendTextLines(Array.isArray(lines) ? lines.map(l => JSON.stringify(l)) : JSON.stringify(lines));
  };

  read = (): T[] => {
    return this.readTextLines().map(l => JSON.parse(l) as T);
  };
}

type Key<T extends object> = keyof T;

export type FileCsvOptions<Row extends object> = {
  parseNumbers?: boolean;
  parseBooleans?: boolean;
  parseNulls?: boolean;
  keys?: Key<Row>[];
};

/**
 * Comma separated values (.csv).
 * Input rows as objects, keys are used as column headers
 */
export class FileCsv<Row extends object> extends File {
  options: FileCsvOptions<Row>;

  constructor(filepath: string, options: FileCsvOptions<Row> = {}) {
    super(filepath.endsWith('.csv') ? filepath : filepath + '.csv');
    this.options = {
      parseNumbers: true,
      parseBooleans: true,
      parseNulls: true,
      ...options,
    };
  }

  write = async (rows: Row[]): Promise<void> => {
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
    return finished(writeToStream(this.writable, [headers, ...outRows]));
  };

  #parseVal = (val: string): string | number | boolean | null => {
    const { parseNumbers, parseBooleans, parseNulls } = this.options;
    if (parseBooleans && val.toLowerCase() === 'false') return false;
    if (parseBooleans && val.toLowerCase() === 'true') return true;
    if (parseNulls && (val.length === 0 || val.toLowerCase() === 'null')) return null;
    if (parseNumbers && /^[\.0-9]+$/.test(val)) return Number(val);
    return val;
  };

  read = async (): Promise<Row[]> => {
    return new Promise<Row[]>((resolve, reject) => {
      const parsed: Row[] = [];
      parseStream(this.readable, { headers: true })
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
  };
}

export class FileImage extends File {
  dimensions = async (): Promise<{
    width: number;
    height: number;
  }> => probeImageSize(this.readable);
}

export class FileVideo extends File {
  dimensions = async (): Promise<{
    width: number;
    height: number;
    duration: number;
  }> =>
    Cmd.ffprobe(`-select_streams v:0 -show_entries stream -of json "${this.path}"`).then(out => {
      const { streams } = JSON.parse(out) as {
        streams: { width: number; height: number; duration: string }[];
      };
      if (!streams[0]) throw new Error('Could not parse video stream');
      return { ...streams[0], duration: Number(streams[0].duration) };
    });
}
