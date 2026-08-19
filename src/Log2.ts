import { inspect } from 'node:util';
import { isObjectLike } from 'lodash-es';
import chalk, { type ChalkInstance } from 'chalk';
import { snapshot } from './snapshot.ts';
import { Format } from './Format.ts';

/**
 * Based on [Google's LogSeverity](https://docs.cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity)
 * without some of the redundant severe levels.
 */
type Severity = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'ALERT';

const GcloudMap: Record<Severity, string> = {
  TRACE: 'DEBUG',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARNING',
  ERROR: 'ERROR',
  ALERT: 'ALERT',
};

type Options = {
  severity: Severity;
  color: ChalkInstance;
};

type Entry = {
  message?: string;
  severity: Severity;
  stack?: string;
  details?: unknown[];
};

/**
 * Levels: TRACE, DEBUG, INFO, WARN, ERROR, ALERT
 * Use `LOG_LEVL=info` to limit what's printed to console
 */
export class Log {
  static getStack() {
    const details = { stack: '' };
    // replaces details.stack with current stack trace, excluding this Log.getStack call
    Error.captureStackTrace(details, Log.getStack);
    // remove 'Error' on first line
    return details.stack
      .split('\n')
      .map(l => l.trim())
      .filter(l => l !== 'Error');
  }

  /**
   * Gcloud parses JSON in stdout
   */
  static #toGcloud(entry: Entry): void {
    const details = entry.details?.length === 1 ? entry.details[0] : entry.details;
    const output = {
      ...entry,
      severity: GcloudMap[entry.severity],
      details,
      stack: entry.stack || this.getStack(),
    };
    console.log(JSON.stringify(snapshot(output)));
  }

  /**
   * Includes colors and better inspection for logging during dev
   */
  static #toConsole(entry: Entry, color: ChalkInstance): void {
    if (entry.message) console.log(color(`${Format.date('h:m:s')} [${entry.severity}] ${entry.message}`));
    entry.details?.forEach(detail => {
      console.log(inspect(detail, { depth: 10, breakLength: 100, compact: true, colors: true }));
    });
  }

  static #log({ severity, color }: Options, ...input: unknown[]): Entry {
    const { message, details } = this.prepare(...input);
    const entry: Entry = { message, severity, details };
    // https://cloud.google.com/run/docs/container-contract#env-vars
    const isGcloud = process.env.K_SERVICE !== undefined || process.env.CLOUD_RUN_JOB !== undefined;
    if (isGcloud) {
      this.#toGcloud(entry);
    } else {
      this.#toConsole(entry, color);
    }
    return entry;
  }

  /**
   * Handle first argument being a string or an object with a 'message' prop
   */
  static prepare(...input: unknown[]): { message?: string; details: unknown[] } {
    let [firstArg, ...rest] = input;
    // First argument is a string, use that as the message
    if (typeof firstArg === 'string') {
      return { message: firstArg, details: rest };
    }
    // First argument is an object with a `message` property
    // @ts-ignore
    if (isObjectLike(firstArg) && typeof firstArg['message'] === 'string') {
      const { message, ...firstDetails } = firstArg as { message: string };
      return { message, details: [firstDetails, ...rest] };
    }
    // No message found, log all args as details
    return { details: input };
  }

  /**
   * trace information (never logged in gcloud)
   */
  static trace = (...input: unknown[]): void => {
    this.#log({ severity: 'TRACE', color: chalk.gray }, ...input);
  };

  /**
   * Debug info (only logged in development)
   */
  static debug = (...input: unknown[]): void => {
    this.#log({ severity: 'DEBUG', color: chalk.gray }, ...input);
  };

  /**
   * Routine information, such as ongoing status or performance
   */
  static info = (...input: unknown[]): void => {
    this.#log({ severity: 'INFO', color: chalk.white }, ...input);
  };

  /**
   * Events that might cause problems
   */
  static warn = (...input: unknown[]): void => {
    this.#log({ severity: 'WARN', color: chalk.yellow }, ...input);
  };

  /**
   * Events that cause problems
   */
  static error = (...input: unknown[]): void => {
    this.#log({ severity: 'ERROR', color: chalk.red }, ...input);
  };

  /**
   * Events that require action or attention immediately.
   */
  static alert = (...input: unknown[]): void => {
    this.#log({ severity: 'ALERT', color: chalk.bgRed }, ...input);
  };
}
