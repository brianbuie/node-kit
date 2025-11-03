import fs from 'fs';
import path from 'path';
import { snapshot } from './snapshot.js';

export class File {
  path;

  constructor(filepath: string) {
    this.path = filepath;
  }

  get exists() {
    return fs.existsSync(this.path);
  }

  read() {
    return this.exists ? fs.readFileSync(this.path, 'utf8') : undefined;
  }

  write(contents: string) {
    fs.mkdirSync(path.parse(this.path).dir, { recursive: true });
    fs.writeFileSync(this.path, contents);
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

  static get Adaptor() {
    return FileAdaptor;
  }

  json<T>() {
    return new JsonFile<T>(this);
  }

  static get json() {
    return JsonFile;
  }

  ndjson<T>() {
    return new NdjsonFile<T>(this);
  }

  static get ndjson() {
    return NdjsonFile;
  }
}

class FileAdaptor {
  file;

  constructor(file: string | File) {
    if (file instanceof File) {
      const withExt = this.addExt(file.path);
      if (withExt === file.path) {
        this.file = file;
      } else {
        this.file = new File(withExt);
      }
    } else {
      this.file = new File(this.addExt(file));
    }
  }

  addExt(filepath: string) {
    return filepath;
  }

  get exists() {
    return this.file.exists;
  }

  get path() {
    return this.file.path;
  }
}

class JsonFile<T> extends FileAdaptor {
  addExt(filepath: string) {
    return filepath.endsWith('.json') ? filepath : filepath + '.json';
  }

  read() {
    const contents = this.file.read();
    return contents ? (JSON.parse(contents) as T) : undefined;
  }

  write(contents: T) {
    this.file.write(JSON.stringify(snapshot(contents), null, 2));
  }
}

class NdjsonFile<T> extends FileAdaptor {
  addExt(filepath: string) {
    return filepath.endsWith('.ndjson') ? filepath : filepath + '.ndjson';
  }

  lines() {
    return this.file.lines().map((l) => JSON.parse(l) as T);
  }

  append(lines: T | T[]) {
    const contents = Array.isArray(lines)
      ? lines.map((l) => JSON.stringify(snapshot(l)))
      : JSON.stringify(snapshot(lines));
    this.file.append(contents);
  }
}
