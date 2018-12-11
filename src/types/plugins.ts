export interface Plugin {
  dappGenerators: any;
}

export interface Plugins {
  getPluginsFor(name: string): [Plugin];
  loadInternalPlugin(name: string, options: any): void;
}
