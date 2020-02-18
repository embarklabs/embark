import {__} from 'embark-i18n';
const ListConfigs = require('./listConfigs.js');
const FunctionConfigs = require('./functionConfigs.js');

class SpecialConfigs {

  constructor(embark, options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.buildDir = options.buildDir;
    this.embark = embark;
    this.config = embark.config;
    this.listConfigs = new ListConfigs(embark);
    this.functionConfigs = new FunctionConfigs(embark);

    this.events.setCommandHandler('deployment:contract:address', this.executeAddressHandlerForContract.bind(this));
    this.embark.registerActionForEvent('deployment:deployContracts:beforeAll', this.beforeAllDeployAction.bind(this));
    this.embark.registerActionForEvent('deployment:deployContracts:afterAll', this.afterAllDeployAction.bind(this));
    this.embark.registerActionForEvent("deployment:contract:deployed", this.doOnDeployAction.bind(this));
    this.embark.registerActionForEvent("deployment:contract:shouldDeploy", this.deployIfAction.bind(this));
    this.embark.registerActionForEvent('deployment:contract:beforeDeploy', this.beforeDeployAction.bind(this));
    this.embark.registerActionForEvent('deployment:contract:determineArgs', this.determineSmartContractArgs.bind(this));
  }

  async executeAddressHandlerForContract(params, cb) {
    return this.functionConfigs.executeContractAddressHandler(params.contract, cb);
  }

  async beforeAllDeployAction(_params, cb) {
    if (typeof this.config.contractsConfig.beforeDeploy !== 'function') {
      return this.listConfigs.beforeAllDeployAction(cb);
    }
    return this.functionConfigs.beforeAllDeployAction(cb);
  }

  async afterAllDeployAction(_params, cb) {
    if (typeof this.config.contractsConfig.afterDeploy !== 'function') {
      return this.listConfigs.afterAllDeployAction(cb);
    }
    return this.functionConfigs.afterAllDeployAction(cb);
  }

  async beforeDeployAction(params, cb) {
    if (params.contract.beforeDeploy) {
      return this.functionConfigs.beforeDeployAction(params, cb);
    }
    cb();
  }

  async determineSmartContractArgs(params, cb) {
    if (typeof params.contract.args === 'function') {
      return this.functionConfigs.determineSmartContractArgs(params, cb);
    }
    cb();
  }

  async doOnDeployAction(params, cb) {
    let contract = params.contract;

    if (!contract.onDeploy || contract.deploy === false) {
      return cb();
    }

    if (!contract.silent) {
      this.logger.info(__('executing onDeploy commands'));
    }

    if (typeof contract.onDeploy === 'function') {
      return this.functionConfigs.doOnDeployAction(contract, cb);
    }
    return this.listConfigs.doOnDeployAction(contract, cb);
  }

  async deployIfAction(params, cb) {
    let cmd = params.contract.deployIf;
    if (!cmd) {
      return cb(null, params);
    }

    if (typeof cmd === 'function') {
      return this.functionConfigs.deployIfAction(params, cb);
    }
    return this.listConfigs.deployIfAction(params, cb);
  }

}

module.exports = SpecialConfigs;
