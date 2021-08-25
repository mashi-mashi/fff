import * as winston from 'winston';
import {LoggingWinston} from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston();

export interface LoggerInterface {
  log: (...any: any[]) => void;
  warn: (...any: any[]) => void;
  error: (...any: any[]) => void;
}
export class Logger implements LoggerInterface {
  public static create = (name: string) => new Logger(name);
  private constructor(
    protected name: string,
    protected client = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({stack: true}),
        winston.format.splat(),
        winston.format.json()
      ),
      transports: [new winston.transports.Console(), loggingWinston],
    })
  ) {
    this.name = name;
    this.client = client;
  }

  public log = (message: string, ...any: any[]) => this.client.info(`[${this.name || ''}]${message}`, ...any);
  public warn = (message: string, ...any: any[]) => this.client.warn(`[${this.name || ''}]${message}`, ...any);
  public error = (message: string, ...any: any[]) => this.client.error(`[${this.name || ''}]${message}`, ...any);
}
