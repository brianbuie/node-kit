import { merge } from 'lodash-es';
import { default as pino, type Logger } from 'pino';

export type LogDetails = Record<string, unknown>;

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
              singleLine: true,
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

  static #getLogger = (): Logger => {
    return (this.#logger ??= this.createLogger());
  };

  static #write = (level: LogLevel, message: string, details?: LogDetails): void => {
    if (details === undefined) {
      Log.#getLogger()[level](message);
    } else {
      Log.#getLogger()[level](details, message);
    }
  };

  static trace = (message: string, details?: LogDetails): void => {
    Log.#write('trace', message, details);
  };

  static debug = (message: string, details?: LogDetails): void => {
    Log.#write('debug', message, details);
  };

  static info = (message: string, details?: LogDetails): void => {
    Log.#write('info', message, details);
  };

  static warn = (message: string, details?: LogDetails): void => {
    Log.#write('warn', message, details);
  };

  static error = (message: string, details?: LogDetails): void => {
    Log.#write('error', message, details);
  };

  static fatal = (message: string, details?: LogDetails): void => {
    Log.#write('fatal', message, details);
  };
}
