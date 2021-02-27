import {logger} from 'firebase-functions';
import {safeStringify} from '../utils/utils';

export class Logger {
  public static create = (name: string) => new Logger(name);
  private constructor(protected name: string, protected prefix?: string) {}

  public setPrefix = (prefix: string) => (this.prefix = prefix);

  public log = (...any: any[]) => logger.log(...this.parse(...this.makeArray(...any)));

  public warn = (...any: any[]) => logger.warn(...this.parse(...this.makeArray(...any)));

  public error = (...any: any[]) => logger.error(...this.parse(...this.makeArray(...any)));

  private makeArray = (...any: any[]) => {
    const arr = [this.name];
    if (this.prefix) arr.push(this.prefix);
    if (any) arr.push(...any);

    return arr;
  };

  private parse = (...any: any[]): string[] =>
    any.map(a => {
      if (a instanceof Error) {
        return (
          'e ' +
          safeStringify({
            ...Object.keys(a).reduce((prev: any, cur: string) => {
              prev[cur] = a[cur as 'message' | 'stack' | 'name'];
              return prev;
            }, {}),
            stack: a.stack && a.stack.replace(/\n/g, ' ').replace(/ {2,}/g, ' '),
          })
        );
      } else {
        return safeStringify(a);
      }
    });
}
