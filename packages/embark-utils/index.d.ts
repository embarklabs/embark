declare module "embark-utils" {
  class File {
    path: string;
    constructor(options: any);
    prepareForCompilation(isCoverage?: boolean): any;
  }

  function anchoredValue(anchor: string|null, value: string): string;
  function anchoredPath(anchor: string|null, ...args: string[]): string;
  function compact(array: any): any;
  function checkIsAvailable(url: string, callback: any): void;
  function dockerHostSwap(host: string): string;
  function dappPath(...names: string[]): string;
  function diagramPath(...names: string[]): string;
  function escapeHtml(message: any): string;
  function embarkPath(...names: string[]): string;
  function exit(code?: any): void;
  function findNextPort(port: number): Promise<number>;
  function jsonFunctionReplacer(key: any, value: any): any;
  function fuzzySearch(text: string, list: any, filter: any): any;
  function getExternalContractUrl(file: string, provideUrl: string): string;
  function recursiveMerge(target: any, source: any): any;
  function pkgPath(...names: string[]): string;
  function removePureView(dir: string): void;
}
