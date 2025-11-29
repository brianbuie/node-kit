[![NPM Version](https://img.shields.io/npm/v/%40brianbuie%2Fnode-kit)](https://www.npmjs.com/package/@brianbuie/node-kit)

# Node Kit

Basic tools for Node.js projects

# Installing

```
npm add @brianbuie/node-kit
```

```js
import { Fetcher, Log } from '@brianbuie/node-kit';
```

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
| [TempDir](#class-tempdir) |
| [TypeWriter](#class-typewriter) |

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

## Class: Cache

Save data to a local file with an expiration.
Fresh/stale data is returned with a flag for if it's fresh or not,
so stale data can still be used if needed.

```ts
export class Cache<T> {
    file;
    ttl;
    constructor(key: string, ttl: number | Duration, initialData?: T) 
    write(data: T) 
    read(): [
        T | undefined,
        boolean
    ] 
}
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Dir

Reference to a specific directory with methods to create and list files.
Default path: '.'
> Created on file system the first time .path is read or any methods are used

```ts
export class Dir {
    #inputPath;
    #resolved?: string;
    constructor(inputPath = ".") 
    get path() 
    dir(subPath: string) 
    tempDir(subPath: string) 
    sanitize(filename: string) 
    filepath(base: string) 
    file(base: string) 
    get files() 
}
```

<details>

<summary>Class Dir Details</summary>

### Constructor

```ts
constructor(inputPath = ".") 
```

Argument Details

+ **path**
  + can be relative to workspace or absolute

### Method dir

Create a new Dir inside the current Dir

```ts
dir(subPath: string) 
```

Argument Details

+ **subPath**
  + joined with parent Dir's path to make new Dir

Example

```ts
const folder = new Dir('example');
// folder.path = '/path/to/cwd/example'
const child = folder.dir('path/to/dir');
// child.path = '/path/to/cwd/example/path/to/dir'
```

### Method filepath

```ts
filepath(base: string) 
```

Argument Details

+ **base**
  + The file base (name and extension)

Example

```ts
const folder = new Dir('example');
const filepath = folder.resolve('file.json');
// 'example/file.json'
```

### Method tempDir

Creates a new TempDir inside current Dir

```ts
tempDir(subPath: string) 
```

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
    defaultOptions;
    constructor(opts: FetchOptions = {}) 
    buildUrl(route: Route, opts: FetchOptions = {}): [
        URL,
        string
    ] 
    buildHeaders(route: Route, opts: FetchOptions = {}) 
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
buildHeaders(route: Route, opts: FetchOptions = {}) 
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
Also returns domain, to help with cookies

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
    path;
    root;
    dir;
    base;
    name;
    ext;
    type;
    constructor(filepath: string) 
    get exists() 
    get stats(): Partial<fs.Stats> 
    delete() 
    read() 
    lines() 
    get readStream() 
    get writeStream() 
    write(contents: string | ReadableStream) 
    append(lines: string | string[]) 
    json<T>(contents?: T) 
    static get json() 
    ndjson<T extends object>(lines?: T | T[]) 
    static get ndjson() 
    async csv<T extends object>(rows?: T[], keys?: (keyof T)[]) 
    static get csv() 
}
```

<details>

<summary>Class File Details</summary>

### Method append

creates file if it doesn't exist, appends string or array of strings as new lines.
File always ends with '\n', so contents don't need to be read before appending

```ts
append(lines: string | string[]) 
```

### Method csv

```ts
async csv<T extends object>(rows?: T[], keys?: (keyof T)[]) 
```

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
delete() 
```

### Method json

```ts
json<T>(contents?: T) 
```

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
lines() 
```

Returns

lines as strings, removes trailing '\n'

### Method ndjson

```ts
ndjson<T extends object>(lines?: T | T[]) 
```

Returns

FileTypeNdjson adaptor for current File, adds '.ndjson' extension if not present.

### Method read

```ts
read() 
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
    file;
    constructor(filepath: string, contents?: string) 
    get exists() 
    get path() 
    delete() 
}
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileTypeCsv

Comma separated values (.csv).
Input rows as objects, keys are used as column headers

```ts
export class FileTypeCsv<Row extends object> extends FileType {
    constructor(filepath: string) 
    async write(rows: Row[], keys?: Key<Row>[]) 
    #parseVal(val: string) 
    async read() 
}
```

See also: [FileType](#class-filetype)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: FileTypeJson

A .json file that maintains data type when reading/writing.
> ⚠️ This is mildly unsafe, important/foreign json files should be validated at runtime!

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
    read() 
    write(contents: T) 
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
    append(lines: T | T[]) 
    lines() 
}
```

See also: [FileType](#class-filetype)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Format

Helpers for formatting dates, times, and numbers as strings

```ts
export class Format {
    static date(formatStr: "iso" | "ymd" | string = "iso", d: DateArg<Date> = new Date()) 
    static round(n: number, places = 0) 
    static ms(ms: number) 
    static bytes(b: number) 
}
```

<details>

<summary>Class Format Details</summary>

### Method date

date-fns format() with some shortcuts

```ts
static date(formatStr: "iso" | "ymd" | string = "iso", d: DateArg<Date> = new Date()) 
```

Argument Details

+ **formatStr**
  + 'iso' to get ISO date, 'ymd' to format as 'yyyy-MM-dd', full options: https://date-fns.org/v4.1.0/docs/format

### Method ms

Make millisecond durations actually readable (eg "123ms", "3.56s", "1m 34s", "3h 24m", "2d 4h")

```ts
static ms(ms: number) 
```

### Method round

Round a number to a specific set of places

```ts
static round(n: number, places = 0) 
```

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: Log

```ts
export class Log {
    static isTest = process.env.npm_package_name === "@brianbuie/node-kit" && process.env.npm_lifecycle_event === "test";
    static #toGcloud(entry: Entry) 
    static #toConsole(entry: Entry, color: ChalkInstance) 
    static #log(options: Options, ...input: unknown[]) 
    static prepare(...input: unknown[]): {
        message?: string;
        details: unknown[];
    } 
    static error(...input: unknown[]) 
    static warn(...input: unknown[]) 
    static notice(...input: unknown[]) 
    static info(...input: unknown[]) 
    static debug(...input: unknown[]) 
}
```

<details>

<summary>Class Log Details</summary>

### Method 

Gcloud parses JSON in stdout

```ts
static #toGcloud(entry: Entry) 
```

### Method 

Includes colors and better inspection for logging during dev

```ts
static #toConsole(entry: Entry, color: ChalkInstance) 
```

### Method error

Logs error details before throwing

```ts
static error(...input: unknown[]) 
```

### Method prepare

Handle first argument being a string or an object with a 'message' prop

```ts
static prepare(...input: unknown[]): {
    message?: string;
    details: unknown[];
} 
```

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: TempDir

Extends Dir class with method to `clear()` contents.
Default path: `./.temp`

```ts
export class TempDir extends Dir {
    constructor(inputPath = `./.temp`) 
    clear() 
}
```

See also: [Dir](#class-dir), [temp](#variable-temp)

<details>

<summary>Class TempDir Details</summary>

### Method clear

> ⚠️ Warning! This deletes the directory!

```ts
clear() 
```

</details>

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Class: TypeWriter

```ts
export class TypeWriter {
    moduleName;
    input = qt.jsonInputForTargetLanguage("typescript");
    outDir;
    qtSettings;
    constructor(moduleName: string, settings: {
        outDir?: string;
    } & Partial<qt.Options> = {}) 
    async addMember(name: string, _samples: any[]) 
    async toString() 
    async toFile() 
}
```

<details>

<summary>Class TypeWriter Details</summary>

### Method toString

function toString() { [native code] }

```ts
async toString() 
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

Allows special objects (Error, Headers, Set) to be included in JSON.stringify output
functions are removed

```ts
export function snapshot(i: unknown, max = 50, depth = 0): any 
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
## Function: timeout

```ts
export async function timeout(ms: number) 
```

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---
# Types

| |
| --- |
| [FetchOptions](#type-fetchoptions) |
| [Query](#type-query) |
| [Route](#type-route) |

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

## Variable: temp

```ts
temp = new TempDir()
```

See also: [TempDir](#class-tempdir)

Links: [API](#api), [Classes](#classes), [Functions](#functions), [Types](#types), [Variables](#variables)

---

<!--#endregion ts2md-api-merged-here-->
