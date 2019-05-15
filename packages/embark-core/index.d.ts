declare module "embark-core" {
  function dappPath(...names: string[]): string;
  function embarkPath(...names: string[]): string;
  function ipcPath(basename: string, usePipePathOnWindows?: boolean): string;
}
