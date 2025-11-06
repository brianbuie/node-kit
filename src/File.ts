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

  delete() {
    fs.rmSync(this.path, { force: true });
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
    return Adaptor;
  }

  json<T>(contents?: T) {
    return new JsonFile<T>(this.path, contents);
  }

  static get json() {
    return JsonFile;
  }

  ndjson<T>(lines?: T | T[]) {
    return new NdjsonFile<T>(this.path, lines);
  }

  static get ndjson() {
    return NdjsonFile;
  }
}

class Adaptor<T = string> {
  file;

  constructor(filepath: string, contents?: T) {
    this.file = new File(filepath);
    if (contents) {
      if (typeof contents !== 'string') {
        throw new Error('File contents must be a string');
      }
      this.file.write(contents);
    }
  }

  get exists() {
    return this.file.exists;
  }

  delete() {
    this.file.delete();
  }

  get path() {
    return this.file.path;
  }
}

class JsonFile<T> extends Adaptor {
  constructor(filepath: string, contents?: T) {
    super(filepath.endsWith('.json') ? filepath : filepath + '.json');
    if (contents) this.write(contents);
  }

  read() {
    const contents = this.file.read();
    return contents ? (JSON.parse(contents) as T) : undefined;
  }

  write(contents: T) {
    this.file.write(JSON.stringify(snapshot(contents), null, 2));
  }
}

class NdjsonFile<T> extends Adaptor {
  constructor(filepath: string, lines?: T | T[]) {
    super(filepath.endsWith('.ndjson') ? filepath : filepath + '.ndjson');
    if (lines) this.append(lines);
  }

  append(lines: T | T[]) {
    this.file.append(
      Array.isArray(lines) ? lines.map((l) => JSON.stringify(snapshot(l))) : JSON.stringify(snapshot(lines))
    );
  }

  lines() {
    return this.file.lines().map((l) => JSON.parse(l) as T);
  }
}
