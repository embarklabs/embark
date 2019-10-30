declare module "embark-utils" {
  import {Logger} from "embark";

  export class File {
    public path: string;
    constructor(options: any);
    public prepareForCompilation(isCoverage?: boolean): any;
  }

  function anchoredValue(anchor: string|null, value: string): string;
  function anchoredPath(anchor: string|null, ...args: string[]): string;
  function compact(array: any): any;
  function checkIsAvailable(url: string, callback: any): void;
  function dockerHostSwap(host: string): string;
  function buildUrl(protocol: string, host: string, port: number, type: string): string;
  function buildUrlFromConfig(config: any): string;
  function canonicalHost(host: string): string;
  function dappPath(...names: string[]): string;
  function diagramPath(...names: string[]): string;
  function escapeHtml(message: any): string;
  function embarkPath(...names: string[]): string;
  function exit(code?: any): void;
  function findMonorepoPackageFromRoot(pkgName: string, prefilter?: null | ((pkgName: string) => (pkgJsonPath: string) => boolean)): Promise<string>;
  function findMonorepoPackageFromRootSync(pkgName: string, prefilter?: null | ((pkgName: string) => (pkgJsonPath: string) => boolean)): string;
  function findNextPort(port: number): Promise<number>;
  function isEs6Module(module: any): boolean;
  function isInsideMonorepo(): Promise<boolean>;
  function isInsideMonorepoSync(): boolean;
  function monorepoRootPath(): Promise<string>;
  function monorepoRootPathSync(): string;
  function jsonFunctionReplacer(key: any, value: any): any;
  function fuzzySearch(text: string, list: any, filter: any): any;
  function getExternalContractUrl(file: string, provideUrl: string): string;
  function recursiveMerge(target: any, source: any): any;
  function pkgPath(...names: string[]): string;
  function removePureView(dir: string): void;
  function pingEndpoint(host: string, port: number, type: string, protocol: string, origin: string, callback: any): void;

  export class AccountParser {
    public static parseAccountsConfig(accountsConfig: any[], web3: any, dappPath: string, logger: Logger, nodeAccounts?: any[]): any[];
  }
}
