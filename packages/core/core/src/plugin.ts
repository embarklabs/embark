import { fileMatchesPattern } from './utils/utils';
import { __ } from 'embark-i18n';
import { dappPath, embarkPath, isEs6Module, joinPath } from 'embark-utils';
import { Logger } from 'embark-logger';
const deepEqual = require('deep-equal');
import * as fs from 'fs-extra';
import { readFileSync, readJsonSync } from 'fs-extra';
import { join } from "path";

const constants = readJsonSync(join(__dirname, '../constants.json'));

// Default priority of actions with no specified priority. 1 => Highest
const DEFAULT_ACTION_PRIORITY = 50;

// TODO: pass other params like blockchainConfig, contract files, etc..
export class Plugin {

  dappPath = dappPath;

  embarkPath = embarkPath;

  name: string;

  isInternal: boolean;

  pluginModule: any;

  pluginPath: string;

  pluginConfig: any;

  shouldInterceptLogs: boolean;

  clientWeb3Providers: any[] = [];

  beforeDeploy: any[] = [];

  contractsGenerators: any[] = [];

  generateCustomContractCode = null;

  testContractFactory = null;

  pipeline: any[] = [];

  pipelineFiles: any[] = [];

  console: any[] = [];

  contractsConfigs: any[] = [];

  contractsFiles: any[] = [];

  compilers: any[] = [];

  serviceChecks: any[] = [];

  dappGenerators: any[] = [];

  pluginTypes: string[] = [];

  uploadCmds: any[] = [];

  apiCalls: any[] = [];

  imports: any[] = [];

  embarkjs_code: any[] = [];

  generated_code: any[] = [];

  embarkjs_init_code: any[] = [];

  embarkjs_init_console_code: any[] = [];

  fs: any;

  afterContractsDeployActions: any[] = [];

  onDeployActions: any[] = [];

  eventActions: any = {};

  _loggerObject: Logger;

  events: any;

  config: any;

  plugins: any;

  pluginsAPI: any;

  env: any;

  loaded = false;

  currentContext: any;

  acceptedContext: any;

  version: string;

  constants: any;

  logger: Logger;

  constructor(options) {
    this.name = options.name;
    this.isInternal = options.isInternal;
    this.pluginModule = options.pluginModule;
    this.pluginPath = options.pluginPath;
    this.pluginConfig = options.pluginConfig;
    this.shouldInterceptLogs = options.interceptLogs;
    this.fs = fs;
    this._loggerObject = options.logger;
    this.logger = this._loggerObject; // Might get changed if we do intercept
    this.events = options.events;
    this.config = options.config;
    this.plugins = options.plugins;
    this.env = options.env;
    this.currentContext = options.context;
    this.acceptedContext = options.pluginConfig.context || [constants.contexts.any];
    this.version = options.version;
    this.constants = constants;
    this.pluginsAPI = options.pluginsAPI;

    if (!Array.isArray(this.currentContext)) {
      this.currentContext = [this.currentContext];
    }
    if (!Array.isArray(this.acceptedContext)) {
      this.acceptedContext = [this.acceptedContext];
    }
    this.registerActionForEvent("tests:config:updated", { priority: 30 }, async ({ accounts }, cb) => {
      this.config.blockchainConfig.accounts = accounts;
      cb(null, null);
    });
  }

  _log(type) {
    this._loggerObject[type](this.name + ':', ...[].slice.call(arguments, 1));
  }

  isContextValid() {
    if (this.currentContext.includes(constants.contexts.any) || this.acceptedContext.includes(constants.contexts.any)) {
      return true;
    }
    return this.acceptedContext.some(context => {
      return this.currentContext.includes(context);
    });
  }

  hasContext(context) {
    return this.currentContext.includes(context);
  }

  loadPlugin() {
    if (!this.isContextValid()) {
      this.logger.warn(__('Plugin {{name}} can only be loaded in the context of "{{contexts}}"', { name: this.name, contexts: this.acceptedContext.join(', ') }));
      return false;
    }
    this.loaded = true;
    if (isEs6Module(this.pluginModule)) {
      if (this.pluginModule.default) {
        this.pluginModule = this.pluginModule.default;
      }
      return new this.pluginModule(this);
    }
    this.pluginModule.call(this, this);
  }

  loadInternalPlugin() {
    if (isEs6Module(this.pluginModule)) {
      if (this.pluginModule.default) {
        this.pluginModule = this.pluginModule.default;
      }
    }
    return new this.pluginModule(this, this.pluginConfig); /*eslint no-new: "off"*/
  }

  loadPluginFile(filename) {
    return readFileSync(this.pathToFile(filename)).toString();
  }

  pathToFile(filename) {
    if (!this.pluginPath) {
      throw new Error('pluginPath not defined for plugin: ' + this.name);
    }
    return joinPath(this.pluginPath, filename);
  }

  // TODO: add deploy provider
  registerClientWeb3Provider(cb) {
    this.clientWeb3Providers.push(cb);
    this.addPluginType('clientWeb3Provider');
  }

  registerContractsGeneration(cb) {
    this.contractsGenerators.push(cb);
    this.addPluginType('contractGeneration');
  }

  registerCustomContractGenerator(cb) {
    this.generateCustomContractCode = cb;
    this.addPluginType('customContractGeneration');
  }

  registerTestContractFactory(cb) {
    this.testContractFactory = cb;
    this.addPluginType('testContractFactory');
  }

  registerPipeline(matcthingFiles, cb) {
    // TODO: generate error for more than one pipeline per plugin
    this.pipeline.push({ matcthingFiles, cb });
    this.addPluginType('pipeline');
  }

  registerDappGenerator(framework, cb) {
    this.dappGenerators.push({ framework, cb });
    this.pluginTypes.push('dappGenerator');
  }

  registerCustomType(type) {
    this.pluginTypes.push(type);
  }

  addFileToPipeline(file, intendedPath, options) {
    this.pipelineFiles.push({ file, intendedPath, options });
    this.addPluginType('pipelineFiles');
  }

  addContractFile(file) {
    if (this.isInternal) {
      throw new Error("this API cannot work for internal modules. please use an event command instead: config:contractsFiles:add");
    }
    this.contractsFiles.push(file);
    this.addPluginType('contractFiles');
  }

  registerConsoleCommand(optionsOrCb) {
    if (typeof optionsOrCb === 'function') {
      this.logger.warn(__('Registering console commands with function syntax is deprecated and will likely be removed in future versions of Embark'));
      this.logger.info(__('You can find the new API documentation here: %s', 'https://framework.embarklabs.io/docs/plugin_reference.html#registerConsoleCommand-options'.underline));
    }
    this.console.push(optionsOrCb);
    this.addPluginType('console');
  }

  // TODO: this only works for services done on startup
  registerServiceCheck(checkName, checkFn, time) {
    this.serviceChecks.push({ checkName, checkFn, time });
    this.addPluginType('serviceChecks');
  }

  has(pluginType) {
    return this.pluginTypes.indexOf(pluginType) >= 0;
  }

  addPluginType(pluginType) {
    this.pluginTypes.push(pluginType);
    this.pluginTypes = Array.from(new Set(this.pluginTypes));
  }

  generateProvider(args) {
    return this.clientWeb3Providers.map(function(cb) {
      return cb.call(this, args);
    }).join("\n");
  }

  generateContracts(args) {
    return this.contractsGenerators.map(function(cb) {
      return cb.call(this, args);
    }).join("\n");
  }

  registerContractConfiguration(config) {
    this.contractsConfigs.push(config);
    this.addPluginType('contractsConfig');
  }

  registerCompiler(extension, cb) {
    this.compilers.push({ extension, cb });
    this.addPluginType('compilers');
  }

  registerUploadCommand(cmd, cb) {
    this.uploadCmds.push({ cmd, cb });
    this.addPluginType('uploadCmds');
  }

  addCodeToEmbarkJS(code) {
    this.addPluginType('embarkjsCode');
    // TODO: what is this/why
    if (!this.embarkjs_code.some((existingCode) => deepEqual(existingCode, code))) {
      this.embarkjs_code.push(code);
    }
  }

  addGeneratedCode(codeCb) {
    this.addPluginType('generatedCode');
    this.generated_code.push(codeCb);
  }

  addProviderInit(providerType, code, initCondition) {
    this.embarkjs_init_code[providerType] = this.embarkjs_init_code[providerType] || [];
    this.embarkjs_init_code[providerType].push([code, initCondition]);
    this.addPluginType('initCode');
  }

  addConsoleProviderInit(providerType, code, initCondition) {
    this.embarkjs_init_console_code[providerType] = this.embarkjs_init_console_code[providerType] || [];
    this.addPluginType('initConsoleCode');
    const toAdd = [code, initCondition];
    if (!this.embarkjs_init_console_code[providerType].some((initConsoleCode) => deepEqual(initConsoleCode, toAdd))) {
      this.embarkjs_init_console_code[providerType].push(toAdd);
    }
  }

  registerImportFile(importName, importLocation) {
    this.imports.push([importName, importLocation]);
    this.addPluginType('imports');
  }

  registerActionForEvent(eventName, options?, cb?) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    if (!this.eventActions[eventName]) {
      this.eventActions[eventName] = [];
    }
    this.eventActions[eventName].push({ action: cb, options: Object.assign({ priority: DEFAULT_ACTION_PRIORITY }, options) });
    this.addPluginType('eventActions');
  }

  registerAPICall(method, endpoint, cb) {
    this.apiCalls.push({ method, endpoint, cb });
    this.addPluginType('apiCalls');
    this.events.emit('plugins:register:api', { method, endpoint, cb });
  }

  runFilePipeline() {
    return this.pipelineFiles.map(file => {
      const obj: any = {};
      obj.filename = file.file.replace('./', '');
      obj.content = this.loadPluginFile(file.file).toString();
      obj.intendedPath = file.intendedPath;
      obj.options = file.options;
      obj.path = this.pathToFile(obj.filename);

      return obj;
    });
  }

  runPipeline(args) {
    // TODO: should iterate the pipelines
    const pipeline = this.pipeline[0];
    const shouldRunPipeline = fileMatchesPattern(pipeline.matcthingFiles, args.targetFile);
    if (shouldRunPipeline) {
      return pipeline.cb.call(this, args);
    }
    return args.source;
  }
}
