import { merge, isObjectLike } from 'lodash-es';
import { default as pino, type Logger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogOptions = pino.LoggerOptions & {
  environment?: string;
};

/**
 * Wrapper for [pino](https://github.com/pinojs/pino)
 * Levels: fatal, error, warn, info, debug, trace
 * Use `LOG_LEVL=info` to limit what's printed to console
 * Use `Log.configure` to customize the pino instance
 */
export class Log {
  static #logger?: Logger;
  static #options: LogOptions;

  static createLogger = (): Logger => {
    const isProduction = this.#options?.environment === 'production' || process.env.NODE_ENV === 'production';
    const defaultOptions: LogOptions = {
      level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: false,
              ignore: 'pid,hostname',
            },
          },
    };
    return pino(merge(defaultOptions, this.#options));
  };

  static configure = (options: LogOptions = {}): void => {
    this.#options = options;
    this.#logger = this.createLogger();
  };

  /**
   * Use first argument as message, if it's a string, otherwise treat it as data
   * Provides a little flexibility, instead of using a dummy message when trying to debug data
   */
  static #write = (level: LogLevel, arg1: any, arg2?: any): void => {
    let msg: string = '';
    let tmp: any = undefined;
    let details: Record<string, unknown> = {};
    if (typeof arg1 === 'string') {
      msg = arg1;
      tmp = arg2;
    } else {
      tmp = arg1;
    }
    if (isObjectLike(tmp) && !Array.isArray(tmp)) {
      details = tmp;
    } else {
      details = { details: tmp };
    }
    (this.#logger ??= this.createLogger())[level](details, msg);
  };

  static trace = (arg1: any, arg2?: any): void => {
    this.#write('trace', arg1, arg2);
  };

  static debug = (arg1: any, arg2?: any): void => {
    this.#write('debug', arg1, arg2);
  };

  static info = (arg1: any, arg2?: any): void => {
    this.#write('info', arg1, arg2);
  };

  static warn = (arg1: any, arg2?: any): void => {
    this.#write('warn', arg1, arg2);
  };

  static error = (arg1: any, arg2?: any): void => {
    this.#write('error', arg1, arg2);
  };

  static fatal = (arg1: any, arg2?: any): void => {
    this.#write('fatal', arg1, arg2);
  };
}
