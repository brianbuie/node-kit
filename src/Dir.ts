import fs from 'fs';
import path from 'path';
import sanitizeFilename from 'sanitize-filename';
import { snapshot } from './snapshot.js';

/**
 * Reference to a specific directory with helpful methods for resolving filepaths,
 * sanitizing filenames, and saving files
 */
export class Dir {
  path;

  /**
   * @param path can be relative to workspace or absolute
   */
  constructor(_path: string) {
    this.path = _path;
  }

  make() {
    fs.mkdirSync(this.path, { recursive: true });
  }

  /**
   * Create a new Dir inside the current Dir
   * @param subPath to create in current Dir
   * @example
   * const folder = new Dir('example');
   * // folder.path = './example'
   * const child = folder.subDir('path/to/dir');
   * // child.path = './example/path/to/dir'
   */
  subDir(subPath: string) {
    return new Dir(path.resolve(this.path, subPath));
  }

  sanitize(name: string) {
    return sanitizeFilename(name.replace('https://', '').replace('www.', ''), { replacement: '_' });
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

  /**
   * Save something in this Dir
   * @param base filename with extension. `.json` will be used if base doesn't include an ext.
   * @param contents `string`, or `any` if it's a json file
   * @returns the filepath of the saved file
   */
  save(base: string, contents: any) {
    if (typeof contents !== 'string') {
      if (!/\.json$/.test(base)) base += '.json';
      contents = JSON.stringify(snapshot(contents), null, 2);
    }
    const filepath = this.filepath(base);
    this.make();
    fs.writeFileSync(filepath, contents);
    return filepath;
  }
}

/**
 * Extends Dir class with method to `clear()` contents
 */
export class TempDir extends Dir {
  subDir(subPath: string) {
    return new TempDir(path.resolve(this.path, subPath));
  }

  clear() {
    fs.rmSync(this.path, { recursive: true, force: true });
  }
}

/**
 * Common temp dir location
 */
export const temp = new TempDir('.temp');
