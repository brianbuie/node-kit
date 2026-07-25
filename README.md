# Node Kit

Basic tools for quick node.js projects

# Installing

[![NPM Version](https://img.shields.io/npm/v/%40brianbuie%2Fnode-kit)](https://www.npmjs.com/package/@brianbuie/node-kit)

```
npm add @brianbuie/node-kit
```

```ts
import { Fetcher, Log } from '@brianbuie/node-kit';
```

## Extending Config

### tsconfig.json

```json
{
  "extends": "./node_modules/@brianbuie/node-kit/tsconfig.json"
}
```

### prettier.config.js

```js
export * from './node_modules/@brianbuie/node-kit/prettier.config.js';
```

Or make changes:

```js
import baseConfig from './node_modules/@brianbuie/node-kit/prettier.config.js';

const config = {
  ...baseConfig,
  printWidth: 80,
};

export default config;
```

# Changelog

## 0.16

- `Log` rewritten using [pino](https://github.com/pinojs/pino) under the hood. Will require updates in projects:
  - `message` is still first argument, but second argument should include all details, instead of using an arbitrary number of args
  - Errors should use the `err` key in the details object, instead of passing the error as an argument
  - Dev defaults to `debug` level, prod defaults to `info`, use `LOG_LEVEL=info` env variable
  - Removed `alert` and `notice` levels
  - New `fatal` level above `error`
  - New `trace` level, below `debug`
- `Dir.txtFiles` renamed from `Dir.textFiles`, for consistency with other file types
- `JsonFileType` & `NdJsonFileType` no longer user the `snapshot` hack to stringify special objects. Will remove `snapshot` in the future.
- `FileTypeCsv`
  - Second argument changed from `keys` array to options object (`keys` can be provided as option)
  - Automatic parsing of numbers, booleans, and nulls can be disabled (`parseNumbers`, `parseBooleans`, `parseNulls`)
- Removed `@types/node` as peer dependency
- Added explicit return types for everything

## 0.15.1

- `Dir` uses YYYYMMDD as default name
- `File` uses YYYYMMDD-HHmmss as default name

## 0.15

- `TypeWriter` option for `outFile`, defaults to `[moduleName].types.ts`

# API

<!--#region ts2md-api-merged-here-->

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

# Classes

| |
| --- |
| [Cache](#class-cache) |
| [Dir](#class-dir) |
| [Fetcher](#class-fetcher) |
| [File](#class-file) |
| [FileType](#class-filetype) |
| [FileTypeCsv](#class-filetypecsv) |
| [FileTypeJson](#class-filetypejson) |
| [FileTypeNdjson](#class-filetypendjson) |
| [Format](#class-format) |
| [Log](#class-log) |
| [TypeWriter](#class-typewriter) |

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

## Class: Cache

Save data to a local file with an expiration.
Fresh/stale data is returned with a flag for if it's fresh or not,
so stale data can still be used if needed.

```ts
export class Cache<T> {
    file: FileTypeJson<{
        savedAt: string;
        data: T;
    }>;
    ttl: Duration;
    constructor(key: string, ttl: number | Duration, initialData?: T) 
    write(data: T) 
    read(): [
        T | undefined,
        boolean
    ] 
}
```

See also: [FileTypeJson](#class-filetypejson)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Dir

Reference to a specific directory with methods to create and list files.

```ts
export class Dir {
    #inputPath: string;
    #resolved?: string;
    isTemp: boolean;
    constructor(inputPath = Format.date("ymd"), options: DirOptions = {}) 
    get pathUnsafe(): string 
    get path(): string 
    get name(): string 
    dir(subPath = Format.date("ymd"), options: DirOptions = { temp: this.isTemp }): Dir 
    tempDir(subPath?: string): Dir 
    sanitize(filename: string): string 
    filepath(base: string): string 
    file(base = Format.date("ymd-hms")): File 
    get contents(): (Dir | File)[] 
    get dirs(): Dir[] 
    get files(): File[] 
    get videos(): File[] 
    get images(): File[] 
    get jsonFiles(): File[] 
    get ndjsonFiles(): File[] 
    get csvFiles(): File[] 
    get txtFiles(): File[] 
    clear(): void 
}
```

See also: [DirOptions](#type-diroptions), [File](#class-file), [Format](#class-format), [temp](#variable-temp)

<details>

<summary>Class Dir Details</summary>

### Constructor

```ts
constructor(inputPath = Format.date("ymd"), options: DirOptions = {}) 
```
See also: [DirOptions](#type-diroptions), [Format](#class-format)

Argument Details

+ **path**
  + can be relative to workspace or absolute

### Method clear

Deletes the contents of the directory. Only allowed if created with `temp` option set to `true` (or created with `dir.tempDir` method).

```ts
clear(): void 
```

### Method dir

Create a new Dir inside the current Dir

```ts
dir(subPath = Format.date("ymd"), options: DirOptions = { temp: this.isTemp }): Dir 
```
See also: [Dir](#class-dir), [DirOptions](#type-diroptions), [Format](#class-format), [temp](#variable-temp)

Argument Details

+ **subPath**
  + joined with parent Dir's path to make new Dir
+ **options**
  + include `{ temp: true }` to enable the `.clear()` method. If current Dir is temporary, child directories will also be temporary.

Example

```ts
const folder = new Dir('example');
// folder.path = '/path/to/cwd/example'
const child = folder.dir('path/to/dir');
// child.path = '/path/to/cwd/example/path/to/dir'
```

### Method file

Create a new file in this directory. Filename defaults to `YYYYMMDD-HHMMSS` if not provided

```ts
file(base = Format.date("ymd-hms")): File 
```
See also: [File](#class-file), [Format](#class-format)

### Method filepath

```ts
filepath(base: string): string 
```

Argument Details

+ **base**
  + The file base (name and extension)

Example

```ts
const folder = new Dir('example');
const filepath = folder.resolve('file.json');
// '/path/to/example/file.json'
```

### Method tempDir

Creates a new temp directory inside current Dir

```ts
tempDir(subPath?: string): Dir 
```
See also: [Dir](#class-dir)

Argument Details

+ **subPath**
  + joined with parent Dir's path to make new TempDir

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Fetcher

Fetcher provides a quick way to set up a basic API connection
with options applied to every request.
Includes basic methods for requesting and parsing responses

```ts
export class Fetcher {
    defaultOptions: FetchOptions;
    constructor(opts: FetchOptions = {}) 
    buildUrl(route: Route, opts: FetchOptions = {}): [
        URL,
        string
    ] 
    buildHeaders(route: Route, opts: FetchOptions = {}): HeadersInit & Record<string, string> 
    buildRequest(route: Route, opts: FetchOptions = {}): [
        Request,
        FetchOptions,
        string
    ] 
    async fetch(route: Route, opts: FetchOptions = {}): Promise<[
        Response,
        Request
    ]> 
    async fetchText(route: Route, opts: FetchOptions = {}): Promise<[
        string,
        Response,
        Request
    ]> 
    async fetchJson<T>(route: Route, opts: FetchOptions = {}): Promise<[
        T,
        Response,
        Request
    ]> 
}
```

See also: [FetchOptions](#type-fetchoptions), [Route](#type-route)

<details>

<summary>Class Fetcher Details</summary>

### Method buildHeaders

Merges options to get headers. Useful when extending the Fetcher class to add custom auth.

```ts
buildHeaders(route: Route, opts: FetchOptions = {}): HeadersInit & Record<string, string> 
```
See also: [FetchOptions](#type-fetchoptions), [Route](#type-route)

### Method buildRequest

Builds request, merging defaultOptions and provided options.
Includes Abort signal for timeout

```ts
buildRequest(route: Route, opts: FetchOptions = {}): [
    Request,
    FetchOptions,
    string
] 
```
See also: [FetchOptions](#type-fetchoptions), [Route](#type-route)

### Method buildUrl

Build URL with URLSearchParams if query is provided.
Also returns domain, to help with cookies.
Query params are merged in this order, last instance of key wins:
1. defaultOptions.query
2. route URLSearchParams
3. options.query

```ts
buildUrl(route: Route, opts: FetchOptions = {}): [
    URL,
    string
] 
```
See also: [FetchOptions](#type-fetchoptions), [Route](#type-route)

### Method fetch

Builds and performs the request, merging provided options with defaultOptions.
If `opts.data` is provided, method is updated to POST, content-type json, data is stringified in the body.
Retries on local or network error, with increasing backoff.

```ts
async fetch(route: Route, opts: FetchOptions = {}): Promise<[
    Response,
    Request
]> 
```
See also: [FetchOptions](#type-fetchoptions), [Route](#type-route)

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: File

Represents a file on the file system. If the file doesn't exist, it is created the first time it is written to.

```ts
export class File {
    path: string;
    root: string;
    dir: string;
    base: string;
    name: string;
    ext: string;
    type?: string;
    constructor(filepath: string) 
    #resolve(filepath: string): string 
    get exists(): boolean 
    get stats(): Partial<fs.Stats> 
    delete(): void 
    read(): string | undefined 
    lines(): string[] 
    get readStream(): fs.ReadStream | Readable 
    get writeStream(): fs.WriteStream 
    write(contents: string | ReadableStream): void | Promise<void> 
    append(lines: string | string[]): void 
    json<T>(contents?: T): FileTypeJson<T> 
    static get json(): typeof FileTypeJson 
    ndjson<T extends object>(lines?: T | T[]): FileTypeNdjson<T> 
    static get ndjson(): typeof FileTypeNdjson 
    async csv<T extends object>(rows?: T[], options?: FileTypeCsvOptions<T>): Promise<FileTypeCsv<T>> 
    static get csv(): typeof FileTypeCsv 
}
```

See also: [FileTypeCsv](#class-filetypecsv), [FileTypeJson](#class-filetypejson), [FileTypeNdjson](#class-filetypendjson)

<details>

<summary>Class File Details</summary>

### Method append

creates file if it doesn't exist, appends string or array of strings as new lines.
File always ends with '\n', so contents don't need to be read before appending

```ts
append(lines: string | string[]): void 
```

### Method csv

```ts
async csv<T extends object>(rows?: T[], options?: FileTypeCsvOptions<T>): Promise<FileTypeCsv<T>> 
```
See also: [FileTypeCsv](#class-filetypecsv)

Returns

FileTypeCsv adaptor for current File, adds '.csv' extension if not present.

Example

```ts
const file = await new File('a').csv([{ col: 'val' }, { col: 'val2' }]); // FileTypeCsv<{ col: string; }>
await file.write([ { col2: 'val2' } ]); // ❌ 'col2' doesn't exist on type { col: string; }
await file.write({ col: 'val' }); // ✅ Writes one row
await file.write([{ col: 'val2' }, { col: 'val3' }]); // ✅ Writes multiple rows
```

### Method delete

Deletes the file if it exists

```ts
delete(): void 
```

### Method json

```ts
json<T>(contents?: T): FileTypeJson<T> 
```
See also: [FileTypeJson](#class-filetypejson)

Returns

FileTypeJson adaptor for current File, adds '.json' extension if not present.

Examples

```ts
const file = new File('./data').json({ key: 'val' }); // FileTypeJson<{ key: string; }>
console.log(file.path) // '/path/to/cwd/data.json'
file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
```

```ts
const file = new File('./data').json<object>({ key: 'val' }); // FileTypeJson<object>
file.write({ something: 'else' }) // ✅ data is typed as object
```

### Method lines

```ts
lines(): string[] 
```

Returns

lines as strings, removes trailing '\n'

### Method ndjson

```ts
ndjson<T extends object>(lines?: T | T[]): FileTypeNdjson<T> 
```
See also: [FileTypeNdjson](#class-filetypendjson)

Returns

FileTypeNdjson adaptor for current File, adds '.ndjson' extension if not present.

### Method read

```ts
read(): string | undefined 
```

Returns

the contents of the file as a string, or undefined if the file doesn't exist

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileType

A generic file adaptor, extended by specific file type implementations

```ts
export class FileType {
    file: File;
    constructor(filepath: string, contents?: string) 
    get path(): string 
    get root(): string 
    get dir(): string 
    get base(): string 
    get name(): string 
    get ext(): string 
    get type(): string | undefined 
    get exists(): boolean 
    get stats(): Partial<fs.Stats> 
    delete(): void 
    get readStream(): fs.ReadStream | Readable 
    get writeStream(): fs.WriteStream 
}
```

See also: [File](#class-file)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileTypeCsv

Comma separated values (.csv).
Input rows as objects, keys are used as column headers

```ts
export class FileTypeCsv<Row extends object> extends FileType {
    options: FileTypeCsvOptions<Row>;
    constructor(filepath: string, options: FileTypeCsvOptions<Row> = {}) 
    async write(rows: Row[]): Promise<void> 
    #parseVal(val: string): string | number | boolean | null 
    async read(): Promise<Row[]> 
}
```

See also: [FileType](#class-filetype)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileTypeJson

A .json file that maintains data type when reading/writing.
> ⚠️ This is mildly unsafe, json files should be validated at runtime!

Examples

```ts
const file = new FileTypeJson('./data', { key: 'val' }); // FileTypeJson<{ key: string; }>
console.log(file.path) // '/path/to/cwd/data.json'
file.write({ something: 'else' }) // ❌ property 'something' doesn't exist on type { key: string; }
```

```ts
const file = new FileTypeJson<object>('./data', { key: 'val' }); // FileTypeJson<object>
file.write({ something: 'else' }) // ✅ data is typed as object
```

```ts
export class FileTypeJson<T> extends FileType {
    constructor(filepath: string, contents?: T) 
    read(): T | undefined 
    write(contents: T): void 
}
```

See also: [FileType](#class-filetype)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileTypeNdjson

New-line delimited json file (.ndjson)

```ts
export class FileTypeNdjson<T extends object> extends FileType {
    constructor(filepath: string, lines?: T | T[]) 
    append(lines: T | T[]): void 
    lines(): T[] 
}
```

See also: [FileType](#class-filetype)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Format

Helpers for formatting dates, times, and numbers as strings

```ts
export class Format {
    static date(formatStr: "iso" | "ymd" | "ymd-hm" | "ymd-hms" | "h:m:s" | string = "iso", d: DateArg<Date> = new Date()): string 
    static round(n: number, places = 0): string 
    static plural(amount: number, singular: string, multiple?: string): string 
    static ms(ms: number, style?: "digital"): string 
    static bytes(b: number): string 
}
```

<details>

<summary>Class Format Details</summary>

### Method date

date-fns format() with some shortcuts

```ts
static date(formatStr: "iso" | "ymd" | "ymd-hm" | "ymd-hms" | "h:m:s" | string = "iso", d: DateArg<Date> = new Date()): string 
```

Argument Details

+ **formatStr**
  + the format to use
+ **date**
  + the date to format, default `new Date()`

Example

```ts
Format.date('iso') // '2026-04-08T13:56:45Z'
Format.date('ymd') // '20260408'
Format.date('ymd-hm') // '20260408-1356'
Format.date('ymd-hms') // '20260408-135645'
Format.date('h:m:s') // '13:56:45'
```

### Method ms

Make millisecond durations actually readable (eg "123ms", "3.56s", "1m 34s", "3h 24m", "2d 4h")

```ts
static ms(ms: number, style?: "digital"): string 
```

Argument Details

+ **ms**
  + milliseconds
+ **style**
  + 'digital' to output as 'HH:MM:SS'

### Method round

Round a number to a specific set of places

```ts
static round(n: number, places = 0): string 
```

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Log

Wrapper for [pino](https://github.com/pinojs/pino)
Levels: fatal, error, warn, info, debug, trace
Use `LOG_LEVL=info` to limit what's printed to console
Use `Log.configure` to customize the pino instance

```ts
export class Log {
    static #logger?: Logger;
    static #options: LogOptions;
    static createLogger(): Logger 
    static configure(options: LogOptions = {}): void 
    static #getLogger(): Logger 
    static #write(level: LogLevel, message: string, details?: LogDetails): void 
    static trace(message: string, details?: LogDetails): void 
    static debug(message: string, details?: LogDetails): void 
    static info(message: string, details?: LogDetails): void 
    static warn(message: string, details?: LogDetails): void 
    static error(message: string, details?: LogDetails): void 
    static fatal(message: string, details?: LogDetails): void 
}
```

See also: [LogDetails](#type-logdetails), [LogLevel](#type-loglevel), [LogOptions](#type-logoptions)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: TypeWriter

Wrapper for [quicktype-core](https://github.com/glideapps/quicktype)

Example

```ts
const group = new TypeWriter('Group');
await types.addMember('Thing', [{ a: 1 }, { a: 2, b: 1 }]);
await types.toFile();
// type def for `Thing` saved in `types/Group.types.ts`
```

```ts
export class TypeWriter {
    moduleName: string;
    input = qt.jsonInputForTargetLanguage("typescript");
    outDir: string;
    outFile: string;
    qtSettings: Partial<qt.Options>;
    constructor(moduleName: string, settings: {
        outDir?: string;
        outFile?: string;
    } & Partial<qt.Options> = {}) 
    async addMember(name: string, _samples: any[]): Promise<void> 
    async toString(): Promise<string> 
    async toFile(): Promise<void> 
}
```

<details>

<summary>Class TypeWriter Details</summary>

### Method toString

function toString() { [native code] }

```ts
async toString(): Promise<string> 
```

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
# Functions

| |
| --- |
| [snapshot](#function-snapshot) |
| [timeout](#function-timeout) |

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

## Function: snapshot

```ts
export function snapshot(i: unknown, max = 50, depth = 0): any 
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Function: timeout

```ts
export async function timeout(ms: number): Promise<void> 
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
# Types

| |
| --- |
| [DirOptions](#type-diroptions) |
| [FetchOptions](#type-fetchoptions) |
| [LogDetails](#type-logdetails) |
| [LogLevel](#type-loglevel) |
| [LogOptions](#type-logoptions) |
| [Query](#type-query) |
| [Route](#type-route) |

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

## Type: DirOptions

```ts
export type DirOptions = {
    temp?: boolean;
}
```

See also: [temp](#variable-temp)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: FetchOptions

```ts
export type FetchOptions = RequestInit & {
    base?: string;
    query?: Query;
    headers?: Record<string, string>;
    data?: any;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
```

See also: [Query](#type-query), [timeout](#function-timeout)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: LogDetails

```ts
export type LogDetails = Record<string, unknown>
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: LogLevel

```ts
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal"
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: LogOptions

```ts
export type LogOptions = pino.LoggerOptions & {
    environment?: string;
}
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: Query

```ts
export type Query = Record<string, QueryVal | QueryVal[]>
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Type: Route

```ts
export type Route = string | URL
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
# Variables

| |
| --- |
| [cwd](#variable-cwd) |
| [temp](#variable-temp) |

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

## Variable: cwd

```ts
cwd = new Dir("./")
```

See also: [Dir](#class-dir)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Variable: temp

```ts
temp = cwd.tempDir(".temp")
```

See also: [cwd](#variable-cwd)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

<!--#endregion ts2md-api-merged-here-->

# Development

Typecheck and run all tests from `*.test.ts` files

```
npm run test
```

Format with Prettier, generate API docs for this Readme

```
npm run build
```

Release a new version

- runs test and build
- If no unstaged changes, creates a new commit with version tag (`preversion` script in package.json)
- Pushes to github (`postversion` script in package.json)
- Triggers github workflow that publishes to npm

```
npm version [patch|minor|major]
```
