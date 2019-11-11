import {Callback} from './callbacks';

export interface Plugin {
  dappGenerators: any;
}

export interface Plugins {
  getPluginsFor(name: string): [Plugin];
  loadInternalPlugin(name: string, options: any): void;
  getPluginsProperty(pluginType: string, property: string, sub_property?: string): any[];
  plugins: Plugin[];
  runActionsForEvent(event: string, args: any, cb: Callback<any>): void;
}

export interface Plugin {
  name: string;
}

export interface CompilerPluginObject {
  extension: string;
  cb: any;
}
