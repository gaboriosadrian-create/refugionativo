export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static prefix = '[STAYFLOW]';

  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    console.info(`${this.prefix} [INFO] ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} [WARN] ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [ERROR] ${message}`, ...args);
  }
}
