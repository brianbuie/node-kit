import { spawn, type SpawnOptionsWithoutStdio } from 'child_process';
import { parseArgsStringToArgv as parseArgs } from 'string-argv';
import { merge, flattenDeep } from 'lodash-es';

export type Args = string | (string | number | null | undefined | Args)[];

/**
 * Spawn a child process for shell commands with `Cmd.run('command arg1=something arg2=2...")`
 * @param args can be provided as a string or array of strings
 * @returns Promise that resolves with content of STDOUT. Rejects with output of STDERR
 */
export class Cmd {
  static bin = '/usr/local/bin';

  /**
   * configure global location of bin files
   */
  static configure({ bin }: { bin: string }): void {
    this.bin = bin;
  }

  static args(args: Args): string[] {
    return typeof args === 'string'
      ? parseArgs(args)
      : parseArgs(
          flattenDeep(args)
            .filter(a => a !== undefined)
            .join(' '),
        );
  }

  static async run(cmd: string, args: Args, opts?: SpawnOptionsWithoutStdio): Promise<string> {
    const options = merge({ timeout: 5 * 60 * 1000 }, opts);
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const child = spawn(`${this.bin}/${cmd}`, this.args(args), options);
      child.stdout.on('data', chunk => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', chunk => {
        stderr += chunk.toString();
      });
      child.on('close', () => {
        const err = stderr.trim();
        if (err.length) return reject(new Error(stderr));
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Run ffmpeg for video processing (ffmpeg needs to be installed separately)
   */
  static async ffmpeg(args: Args) {
    return this.run('ffmpeg', ['-y', '-loglevel', 'error', args], { timeout: 10 * 60 * 1000 });
  }

  /**
   * Use ffprobe to get video stream dimensions (ffprobe needs to be installed separately)
   */
  static async ffprobe(args: Args) {
    return this.run('ffprobe', ['-v', 'error', args], { timeout: 10 * 60 * 1000 });
  }
}
