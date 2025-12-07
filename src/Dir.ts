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
   * The path of this Dir instance. Created on file system the first time this property is read/used.
   */
  get path() {
    if (!this.#resolved) {
      this.#resolved = path.resolve(this.#inputPath);
      fs.mkdirSync(this.#resolved, { recursive: true });
    }
    return this.#resolved;
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

  file(base: string) {
    return new File(this.filepath(base));
  }

  get files() {
    return fs.readdirSync(this.path).map(filename => this.file(filename));
  }

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
