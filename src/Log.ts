import { inspect } from 'node:util';
import { isObjectLike } from 'lodash-es';
import chalk, { type ChalkInstance } from 'chalk';
import { snapshot } from './snapshot.js';
import pkg from '../package.json' with { type: 'json' };

type Severity = 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY';

type Options = {
  severity: Severity;
  color: ChalkInstance;
};

type Entry = {
  message?: string;
  severity: Severity;
  details?: unknown[];
};

export class Log {
  // Only silence logs when THIS package is running its own tests
  static isTest = process.env.npm_package_name === pkg.name && process.env.npm_lifecycle_event === 'test';

  /**
   * Gcloud parses JSON in stdout
   */
  static #toGcloud(entry: Entry) {
    if (entry.details?.length === 1) {
      console.log(JSON.stringify({ ...entry, details: entry.details[0] }));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Includes colors and better inspection for logging during dev
   */
  static #toConsole(entry: Entry, color: ChalkInstance) {
    if (entry.message) console.log(color(`[${entry.severity}] ${entry.message}`));
    entry.details?.forEach((detail) => {
      console.log(inspect(detail, { depth: 10, breakLength: 100, compact: true, colors: true }));
    });
  }

  static #log(options: Options, ...input: unknown[]) {
    const { message, details } = this.prepare(...input);
    // https://cloud.google.com/run/docs/container-contract#env-vars
    const isGcloud = process.env.K_SERVICE !== undefined || process.env.CLOUD_RUN_JOB !== undefined;
    if (isGcloud) {
      this.#toGcloud({ message, severity: options.severity, details });
      return { message, details, options };
    }
    // Hide output while testing this package
    if (!this.isTest) {
      this.#toConsole({ message, severity: options.severity, details }, options.color);
    }
    return { message, details, options };
  }

  /**
   * Handle first argument being a string or an object with a 'message' prop
   * Also snapshots special objects (eg Error, Response) to keep props in later JSON.stringify output
   */
  static prepare(...input: unknown[]): { message?: string; details: unknown[] } {
    let [first, ...rest] = input.map((i) => snapshot(i));
    if (typeof first === 'string') return { message: first, details: rest };
    // @ts-ignore
    if (isObjectLike(first) && typeof first['message'] === 'string') {
      const { message, ...firstDetails } = first as { message: string };
      return { message, details: [firstDetails, ...rest] };
    }
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
    const debugging = process.argv.some((arg) => arg.includes('--debug')) || process.env.DEBUG !== undefined;
    if (debugging || process.env.NODE_ENV !== 'production') {
      return this.#log({ severity: 'DEBUG', color: chalk.gray }, ...input);
    }
  }
}
