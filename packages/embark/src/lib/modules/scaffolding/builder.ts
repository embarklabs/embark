export interface Builder {
  build(): Promise<string[]>;
}
