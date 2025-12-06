import { inspect } from 'node:util';
import { isObjectLike } from 'lodash-es';
import chalk, { type ChalkInstance } from 'chalk';
import { snapshot } from './snapshot.ts';
import { Format } from './Format.ts';

type Severity = 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY';

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
  static #toGcloud(entry: Entry) {
    const details = entry.details?.length === 1 ? entry.details[0] : entry.details;
    const output = { ...entry, details, stack: entry.stack || this.getStack() };
    console.log(JSON.stringify(snapshot(output)));
  }

  /**
   * Includes colors and better inspection for logging during dev
   */
  static #toConsole(entry: Entry, color: ChalkInstance) {
    if (entry.message) console.log(color(`${Format.date('h:m:s')} [${entry.severity}] ${entry.message}`));
    entry.details?.forEach(detail => {
      console.log(inspect(detail, { depth: 10, breakLength: 100, compact: true, colors: true }));
    });
  }

  static #log({ severity, color }: Options, ...input: unknown[]) {
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
   * Logs error details before throwing
   */
  static error(...input: unknown[]) {
    const { message } = this.#log({ severity: 'ERROR', color: chalk.red }, ...input);
    throw new Error(message);
  }

  static warn(...input: unknown[]) {
    return this.#log({ severity: 'WARNING', color: chalk.yellow }, ...input);
  }

  static notice(...input: unknown[]) {
    return this.#log({ severity: 'NOTICE', color: chalk.cyan }, ...input);
  }

  static info(...input: unknown[]) {
    return this.#log({ severity: 'INFO', color: chalk.white }, ...input);
  }

  static debug(...input: unknown[]) {
    return this.#log({ severity: 'DEBUG', color: chalk.gray }, ...input);
  }
}
