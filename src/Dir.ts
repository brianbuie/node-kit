import * as fs from 'node:fs';
import * as path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { File } from './File.ts';

export type DirOptions = {
  temp?: boolean;
};

/**
 * Reference to a specific directory with methods to create and list files.
 * @param inputPath
 * The path of the directory, created on file system the first time `.path` is read or any methods are used
 * @param options
 * include `{ temp: true }` to enable the `.clear()` method
 */
export class Dir {
  #inputPath;
  #resolved?: string;
  isTemp;

  /**
   * @param path can be relative to workspace or absolute
   */
  constructor(inputPath: string, options: DirOptions = {}) {
    this.#inputPath = inputPath;
    this.isTemp = Boolean(options.temp);
  }

  /**
   * The path of the directory, which might not exist yet.
   */
  get pathUnsafe() {
    return this.#resolved || path.resolve(this.#inputPath);
  }

  /**
   * The path of this Dir instance. Created on file system the first time this property is read/used.
   * Safe to use the directory immediately, without calling mkdir separately.
   */
  get path() {
    // avoids calling mkdir every time path is read
    if (!this.#resolved) {
      this.#resolved = this.pathUnsafe;
      fs.mkdirSync(this.#resolved, { recursive: true });
    }
    return this.#resolved;
  }

  /**
   * The last segment in the path. Doesn't read this.path, to avoid creating directory on file system before it's needed.
   * @example
   * const example = new Dir('/path/to/folder');
   * console.log(example.name); // "folder"
   */
  get name() {
    return this.pathUnsafe.split(path.sep).at(-1)!;
  }

  /**
   * Create a new Dir inside the current Dir
   * @param subPath
   * joined with parent Dir's path to make new Dir
   * @param options
   * include `{ temp: true }` to enable the `.clear()` method. If current Dir is temporary, child directories will also be temporary.
   * @example
   * const folder = new Dir('example');
   * // folder.path = '/path/to/cwd/example'
   * const child = folder.dir('path/to/dir');
   * // child.path = '/path/to/cwd/example/path/to/dir'
   */
  dir(subPath: string, options: DirOptions = { temp: this.isTemp }) {
    return new (this.constructor as typeof Dir)(path.join(this.path, subPath), options) as this;
  }

  /**
   * Creates a new temp directory inside current Dir
   * @param subPath joined with parent Dir's path to make new TempDir
   */
  tempDir(subPath: string) {
    return this.dir(subPath, { temp: true });
  }

  sanitize(filename: string) {
    const notUrl = filename.replace('https://', '').replace('www.', '');
    return sanitizeFilename(notUrl, { replacement: '_' }).slice(-200);
  }

  /**
   * @param base - The file base (name and extension)
   * @example
   * const folder = new Dir('example');
   * const filepath = folder.resolve('file.json');
   * // 'example/file.json'
   */
  filepath(base: string) {
    return path.resolve(this.path, this.sanitize(base));
  }

  /**
   * Create a new file in this directory
   */
  file(base: string) {
    return new File(this.filepath(base));
  }

  /**
   * All files and subdirectories in in this directory, returned as Dir and File instances
   */
  get contents(): (Dir | File)[] {
    return fs
      .readdirSync(this.path)
      .map(name => (fs.statSync(path.join(this.path, name)).isDirectory() ? this.dir(name) : this.file(name)));
  }

  /**
   * All subdirectories in this directory
   */
  get dirs() {
    return this.contents.filter(f => f instanceof Dir);
  }

  /**
   * All files in this directory
   */
  get files() {
    return this.contents.filter(f => f instanceof File);
  }

  /**
   * All files with MIME type that includes "video"
   */
  get videos() {
    return this.files.filter(f => f.type?.includes('video'));
  }

  /**
   * All files with MIME type that includes "image"
   */
  get images() {
    return this.files.filter(f => f.type?.includes('image'));
  }

  /**
   * All files with ext ".json"
   * @example
   * // Directory of json files with the same shape
   * const dataFiles = dataDir.jsonFiles.map(f => f.json<ExampleType>());
   * // dataFiles: FileTypeJson<ExampleType>[]
   */
  get jsonFiles() {
    return this.files.filter(f => f.ext === '.json');
  }

  /**
   * All files with ext ".ndjson"
   * @example
   * // Directory of ndjson files with the same shape
   * const dataFiles = dataDir.ndjsonFiles.map(f => f.ndjson<ExampleType>());
   * // dataFiles: FileTypeNdjson<ExampleType>[]
   */
  get ndjsonFiles() {
    return this.files.filter(f => f.ext === '.ndjson');
  }

  /**
   * All files with ext ".csv"
   * @example
   * // Directory of csv files with the same shape
   * const dataFiles = dataDir.csvFile.map(f => f.csv<ExampleType>());
   * // dataFiles: FileTypeCsv<ExampleType>[]
   */
  get csvFiles() {
    return this.files.filter(f => f.ext === '.csv');
  }

  /**
   * All files with ext ".txt"
   */
  get textFiles() {
    return this.files.filter(f => f.ext === '.txt');
  }

  /**
   * Deletes the contents of the directory. Only allowed if created with `temp` option set to `true` (or created with `dir.tempDir` method).
   */
  clear() {
    if (!this.isTemp) throw new Error('Dir is not temporary');
    fs.rmSync(this.path, { recursive: true, force: true });
    fs.mkdirSync(this.path, { recursive: true });
  }
}

/**
 * Current working directory
 */
export const cwd = new Dir('./');
/**
 * ./.temp in current working directory
 */
export const temp = cwd.tempDir('.temp');
