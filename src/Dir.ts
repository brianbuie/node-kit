import * as fs from 'node:fs';
import * as path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import { File } from './File.ts';

/**
 * Reference to a specific directory with methods to create and list files.
 * Created immediately if it doesn't exist
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
    return new Dir(path.resolve(this.path, subPath));
  }

  tempDir(subPath: string) {
    return new TempDir(path.resolve(this.path, subPath));
  }

  sanitize(filename: string) {
    return sanitizeFilename(filename.replace('https://', '').replace('www.', ''), { replacement: '_' }).slice(-200);
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

  get files() {
    return fs.readdirSync(this.path).map((filename) => this.file(filename));
  }
}

/**
 * Extends Dir class with method to `clear()` contents
 */
export class TempDir extends Dir {
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
