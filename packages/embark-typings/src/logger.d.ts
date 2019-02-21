export interface Logger {
  info(text: string): void;
  error(text: string, ...args: Array<string|Error>): void;
}
