export interface Builder {
  build(): Promise<Array<(string| undefined)>>;
}
