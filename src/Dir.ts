import * as fs from 'node:fs';
import * as path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { File } from './File.ts';

/**
 * Reference to a specific directory with methods to create and list files.
 * Created immediately if it doesn't exist.
 * Default path: './'
 */
export class Dir {
  path;

  /**
   * @param path can be relative to workspace or absolute
   */
  constructor(inputPath = './') {
    this.path = path.resolve(inputPath);
    fs.mkdirSync(this.path, { recursive: true });
  }

  notAbsolute(subPath: string) {
    if (path.isAbsolute(subPath)) throw new Error(`Absolute path provided: "${subPath}"`);
    return subPath;
  }

  /**
   * Create a new Dir inside the current Dir
   * @param subPath relative path to create
   * @example
   * const folder = new Dir('example');
   * // folder.path = '/absolute/path/to/example'
   * const child = folder.dir('path/to/dir');
   * // child.path = '/absolute/path/to/example/path/to/dir'
   */
  dir(subPath: string) {
    return new Dir(path.resolve(this.path, this.notAbsolute(subPath)));
  }

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
 * Default path: `./.${Date.now()}`
 */
export class TempDir extends Dir {
  constructor(inputPath = `./.${Date.now()}`) {
    super(inputPath);
  }

  /**
   * > ⚠️ Warning! This deletes the directory, make sure it's not
   */
  clear() {
    fs.rmSync(this.path, { recursive: true, force: true });
    fs.mkdirSync(this.path, { recursive: true });
  }
}

/**
 * Creates a '.temp' directory in current working directory
 */
export function temp() {
  return new TempDir('.temp');
}
