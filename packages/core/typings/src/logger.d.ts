export interface Logger {
  info(text: string): void;
  warn(text: string): void;
  debug(text: string): void;
  trace(text: string): void;
  error(text: string, ...args: Array<string | Error>): void;
}
