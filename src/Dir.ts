import * as fs from 'node:fs';
import * as path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { File } from './File.ts';

/**
 * Reference to a specific directory with methods to create and list files.
 * Default path: './'
 * > Created on file system the first time .path is read or any methods are used
 */
export class Dir {
  #inputPath;
  #resolved?: string;

  /**
   * @param path can be relative to workspace or absolute
   */
  constructor(inputPath = './') {
    this.#inputPath = path.resolve(inputPath);
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

  notAbsolute(subPath: string) {
    if (path.isAbsolute(subPath)) throw new Error(`Absolute path provided: "${subPath}"`);
    return subPath;
  }

  /**
   * Create a new Dir inside the current Dir
   * @param subPath relative path to create (not absolute)
   * @example
   * const folder = new Dir('example');
   * // folder.path = '/absolute/path/to/example'
   * const child = folder.dir('path/to/dir');
   * // child.path = '/absolute/path/to/example/path/to/dir'
   */
  dir(subPath: string) {
    return new Dir(path.resolve(this.path, this.notAbsolute(subPath)));
  }

  /**
   * Creates a new TempDir inside current Dir
   * @param subPath relative path to create (not absolute)
   */
  tempDir(subPath: string) {
    return new TempDir(path.resolve(this.path, this.notAbsolute(subPath)));
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
    return fs.readdirSync(this.path).map((filename) => this.file(filename));
  }
}

/**
 * Extends Dir class with method to `clear()` contents.
 * Default path: `./.temp`
 */
export class TempDir extends Dir {
  constructor(inputPath = `./.temp`) {
    super(inputPath);
  }

  /**
   * > ⚠️ Warning! This deletes the directory!
   */
  clear() {
    fs.rmSync(this.path, { recursive: true, force: true });
    fs.mkdirSync(this.path, { recursive: true });
  }
}

/**
 * './.temp' in current working directory
 */
export const temp = new TempDir();
