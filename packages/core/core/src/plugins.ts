import * as fs from './fs';
import { Plugin } from './plugin';
import { EmbarkEmitter as Events } from './events';
import { Config } from './config';
import { IPC } from './ipc';

import * as async from 'async';
import { dappPath, embarkPath } from 'embark-utils';
import { Logger } from 'embark-logger';
import findUp from 'find-up';
import { dirname } from 'path';

export class Plugins {

  pluginList = [];

  interceptLogs: boolean;

  plugins: Plugin[] = [];

  logger: Logger;

  events: Events;

  config: Config;

  context: any;

  fs: any;

  env: string;

  version: string;

  client: string;

  static deprecated = {
    'embarkjs-connector-web3': '4.1.0'
  };

  constructor(options) {
    this.pluginList = options.plugins || [];
    this.interceptLogs = options.interceptLogs;
    // TODO: need backup 'NullLogger'
    this.logger = options.logger;
    this.events = options.events;
    this.config = options.config;
    this.context = options.context;
    this.fs = fs;
    this.env = options.env;
    this.version = options.version;
    this.client = options.client;
  }

  loadPlugins() {
    Object.entries(Plugins.deprecated).forEach(([pluginName, embarkVersion]) => {
      if (this.pluginList[pluginName]) {
        delete this.pluginList[pluginName];
        this.logger.warn(`${pluginName} plugin was not loaded because it has been deprecated as of embark v${embarkVersion}, please remove it from this project's embark.json and package.json`);
      }
    });
    Object.entries(this.pluginList).forEach(([pluginName, pluginConfig]) => {
      this.loadPlugin(pluginName, pluginConfig);
    });
  }

  listPlugins() {
    return this.plugins.reduce((list: string[], plugin) => {
      if (plugin.loaded) {
        list.push(plugin.name);
      }
      return list;
    }, []);
  }

  // for services that act as a plugin but have core functionality
  createPlugin(pluginName, pluginConfig) {
    const plugin = {};
    const pluginPath = false;
    const pluginWrapper = new Plugin({
      name: pluginName,
      pluginModule: plugin,
      pluginConfig,
      logger: this.logger,
      pluginPath,
      interceptLogs: this.interceptLogs,
      events: this.events,
      config: this.config,
      plugins: this.plugins,
      pluginsAPI: this,
      fs: this.fs,
      isInternal: true,
      context: this.context,
      client: this.client
    });
    this.plugins.push(pluginWrapper);
    return pluginWrapper;
  }

  loadInternalPlugin(pluginName, pluginConfig, isPackage?: boolean) {
    let pluginPath;
    let plugin;
    if (isPackage) {
      pluginPath = pluginName;
      plugin = require(pluginName);
    } else {
      pluginPath = embarkPath('dist/lib/modules/' + pluginName);
      plugin = require(pluginPath);
    }

    if (plugin.default) {
      plugin = plugin.default;
    }

    const pluginWrapper = new Plugin({
      name: pluginName,
      pluginModule: plugin,
      pluginConfig: pluginConfig || {},
      logger: this.logger,
      pluginPath,
      interceptLogs: this.interceptLogs,
      events: this.events,
      config: this.config,
      plugins: this.plugins,
      pluginsAPI: this,
      fs: this.fs,
      isInternal: true,
      context: this.context,
      env: this.env,
      client: this.client
    });
    const pluginInstance = pluginWrapper.loadInternalPlugin();
    this.plugins.push(pluginWrapper);
    return pluginInstance;
  }

  loadPlugin(pluginName, pluginConfig) {
    const pluginPath = dirname(findUp.sync('package.json', {
      cwd: dirname(require.resolve(pluginName, {paths: [dappPath()]}))
    }) as string);
    let plugin = require(pluginPath);

    if (plugin.default) {
      plugin = plugin.default;
    }

    const pluginWrapper = new Plugin({
      name: pluginName,
      pluginModule: plugin,
      pluginConfig,
      logger: this.logger,
      pluginPath,
      interceptLogs: this.interceptLogs,
      events: this.events,
      config: this.config,
      plugins: this.plugins,
      pluginsAPI: this,
      fs: this.fs,
      isInternal: false,
      context: this.context,
      version: this.version,
      client: this.client
    });
    pluginWrapper.loadPlugin();
    this.plugins.push(pluginWrapper);
  }

  getPluginsFor(pluginType) {
    return this.plugins.filter(plugin => {
      return plugin.has(pluginType);
    });
  }

  getPluginsProperty(pluginType, property, sub_property?: any) {
    const matchingPlugins = this.plugins.filter(plugin => {
      return plugin.has(pluginType);
    });

    // Sort internal plugins first
    matchingPlugins.sort((a, b) => {
      if (a.isInternal) {
        return -1;
      }
      if (b.isInternal) {
        return 1;
      }
      return 0;
    });

    let matchingProperties = matchingPlugins.map((plugin) => {
      if (sub_property) {
        return plugin[property][sub_property];
      }
      return plugin[property];
    });

    // Remove empty properties
    matchingProperties = matchingProperties.filter(prop => prop);

    // return flattened list
    if (matchingProperties.length === 0) { return []; }
    return matchingProperties.reduce((a, b) => a.concat(b)) || [];
  }

  getPluginsPropertyAndPluginName(pluginType, property, sub_property) {
    const matchingPlugins = this.plugins.filter(plugin => {
      return plugin.has(pluginType);
    });

    // Sort internal plugins first
    matchingPlugins.sort((a, b) => {
      if (a.isInternal) {
        return -1;
      }
      if (b.isInternal) {
        return 1;
      }
      return 0;
    });

    let matchingProperties: any[] = [];
    matchingPlugins.forEach(plugin => {
      if (sub_property) {
        for (const kall of (plugin[property][sub_property] || [])) {
          matchingProperties.push([kall, plugin.name]);
        }
        return;
      }

      for (const kall of (plugin[property] || [])) {
        matchingProperties.push([kall, plugin.name]);
      }
    });

    // Remove empty properties
    matchingProperties = matchingProperties.filter(prop => prop[0]);

    // return flattened list
    if (matchingProperties.length === 0) { return []; }
    // return matchingProperties.reduce((a,b) => { return a.concat(b); }) || [];
    return matchingProperties;
  }

  // TODO: because this is potentially hanging, we should issue a trace warning if the event does not exists
  runActionsForEvent(eventName, args, cb) {
    const self = this;
    if (typeof (args) === 'function') {
      cb = args;
      args = [];
    }
    const actionPlugins = this.getPluginsPropertyAndPluginName('eventActions', 'eventActions', eventName);

    if (actionPlugins.length === 0) {
      return cb(null, args);
    }

    actionPlugins.sort((a, b) => {
      const aPriority = a[0].options.priority;
      const bPriority = b[0].options.priority;
      if (aPriority < bPriority) {
        return -1;
      }
      if (aPriority > bPriority) {
        return 1;
      }
      return 0;
    });

    this.events.log("ACTION", eventName, "");

    async.reduce(actionPlugins, args, (current_args, pluginObj: any, nextEach) => {
      const [plugin, pluginName] = pluginObj;

      self.events.log("== ACTION FOR " + eventName, plugin.action.name, pluginName);

      if (typeof (args) === 'function') {
        plugin.action.call(plugin.action, (...params) => {
          nextEach(...params || current_args);
        });
      } else {
        plugin.action.call(plugin.action, args, (...params) => {
          nextEach(...params || current_args);
        });
      }
    }, cb);
  }

  emitAndRunActionsForEvent(eventName, args, cb) {
    if (typeof (args) === 'function') {
      cb = args;
      args = [];
    }
    this.events.emit(eventName, args);
    return this.runActionsForEvent(eventName, args, cb);
  }
}
