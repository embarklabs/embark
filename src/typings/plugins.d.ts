export interface Plugin {
  dappGenerators: any;
}

export interface Plugins {
  getPluginsFor(name: string): [Plugin];
  loadInternalPlugin(name: string, options: any): void;
  getPluginsProperty(prop: string, name: string): any[];
}

export interface CompilerPluginObject {
  extension: string;
  cb: any;
}
