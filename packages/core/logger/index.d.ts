export class Logger {
  constructor(options: any);
  info(text: string): void;
  warn(text: string): void;
  debug(text: string): void;
  trace(text: string): void;
  error(text: string, ...args: Array<string | Error>): void;
  dir(text: string): void;
}
