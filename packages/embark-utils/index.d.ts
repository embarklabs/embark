declare module "embark-utils" {
  class File {
    path: string;
    constructor(options: any);
    prepareForCompilation(isCoverage?: boolean): any;
  }

  function compact(array: any): any;
  function checkIsAvailable(url: string, callback: any): void;
  function dockerHostSwap(host: string): string;
  function dappPath(...names: string[]): string;
  function escapeHtml(message: any): string;
  function embarkPath(...names: string[]): string;
  function exit(code?: any): void;
  function findNextPort(port: number): Promise<number>;
  function jsonFunctionReplacer(key: any, value: any): any;
  function fuzzySearch(text: string, list: any, filter: any): any;
  function getExternalContractUrl(file: string, provideUrl: string): string;
  function recursiveMerge(target: any, source: any): any;
  function removePureView(dir: string): void;
}
