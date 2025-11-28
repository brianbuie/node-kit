import { format, formatISO, type DateArg } from 'date-fns';

/**
 * Helpers for formatting dates, times, and numbers as strings
 */
export class Format {
  /**
   * date-fns format() with some shortcuts
   * @param formatStr
   * 'iso' to get ISO date, 'ymd' to format as 'yyyy-MM-dd', full options: https://date-fns.org/v4.1.0/docs/format
   */
  static date(formatStr: 'iso' | 'ymd' | string = 'iso', d: DateArg<Date> = new Date()) {
    if (formatStr === 'iso') return formatISO(d);
    if (formatStr === 'ymd') return format(d, 'yyyy-MM-dd');
    return format(d, formatStr);
  }

  /**
   * Round a number to a specific set of places
   */
  static round(n: number, places = 0) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: places }).format(n);
  }

  /**
   * Make millisecond durations actually readable (eg "123ms", "3.56s", "1m 34s", "3h 24m", "2d 4h")
   */
  static ms(ms: number) {
    if (ms < 1000) return `${this.round(ms)}ms`;
    const s = ms / 1000;
    if (s < 60) return `${this.round(s, 2)}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${Math.floor(s) % 60}s`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }

  static bytes(b: number) {
    const labels = ['b', 'KB', 'MB', 'GB', 'TB'];
    let factor = 0;
    while (b >= 1024 && labels[factor + 1]) {
      b = b / 1024;
      factor++;
    }
    return `${this.round(b, 2)} ${labels[factor]}`;
  }
}
