import * as winston from 'winston';

export class Logger {
  public static create = (name: string) => new Logger(name);
  private constructor(
    protected name: string,
    protected client = winston.createLogger({
      level: 'silly',
      transports: [new winston.transports.Console()],
    })
  ) {
    this.name = name;
    this.client = client;
  }

  public log = (message: string, ...any: any[]) => this.client.info(`[${this.name || ''}]${message}`, ...any);
  public warn = (message: string, ...any: any[]) => this.client.warn(`[${this.name || ''}]${message}`, ...any);
  public error = (message: string, ...any: any[]) => this.client.error(`[${this.name || ''}]${message}`, ...any);
}
