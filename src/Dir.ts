import * as fs from 'node:fs';
import * as path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { File } from './File.ts';

/**
 * Reference to a specific directory with helpful methods for resolving filepaths,
 * sanitizing filenames, and saving files.
 */
export class Dir {
  path;

  /**
   * @param path can be relative to workspace or absolute
   */
  constructor(_path = './') {
    this.path = path.resolve(_path);
  }

  create() {
    fs.mkdirSync(this.path, { recursive: true });
  }

  /**
   * Create a new Dir inside the current Dir
   * @param subPath to create in current Dir
   * @example
   * const folder = new Dir('example');
   * // folder.path = './example'
   * const child = folder.dir('path/to/dir');
   * // child.path = './example/path/to/dir'
   */
  dir(subPath: string) {
    return new Dir(path.resolve(this.path, subPath));
  }

  tempDir(subPath: string) {
    return new TempDir(path.resolve(this.path, subPath));
  }

  sanitize(name: string) {
    return sanitizeFilename(name.replace('https://', '').replace('www.', ''), { replacement: '_' }).slice(-200);
  }

  /**
   * @param base - The file name with extension
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
}

/**
 * Extends Dir class with method to `clear()` contents
 */
export class TempDir extends Dir {
  clear() {
    fs.rmSync(this.path, { recursive: true, force: true });
    this.create();
  }
}

/**
 * Common temp dir location
 */
export const temp = new TempDir('.temp');
