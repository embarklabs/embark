import {__} from 'embark-i18n';

export default class Namesystem {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = this.embark.events;
    this.namesystemConfig = this.embark.config.namesystemConfig;

    this.namesystemNodes = {};

    this.registerCommandHandlers();
  }

  registerCommandHandlers() {
    this.events.setCommandHandler("namesystem:node:register", (nodeName, startFunction, executeCommand) => {
      this.namesystemNodes[nodeName] = {startFunction, executeCommand, started: false};
    });

    this.events.setCommandHandler("namesystem:node:start", this.startNode.bind(this));

    this.events.setCommandHandler("namesystem:resolve", (name, cb) => {
      this.executeNodeCommand('resolve', [name], cb);
    });

    this.events.setCommandHandler("namesystem:lookup", (address, cb) => {
      this.executeNodeCommand('lookup', [address], cb);
    });

    this.events.setCommandHandler("namesystem:registerSubdomain", (name, address, cb) => {
      this.executeNodeCommand('registerSubdomain', [name, address], cb);
    });

    this.embark.events.setCommandHandler("module:namesystem:reset", (cb) => {
      this.executeNodeCommand('reset', [], (_err) => {
        // We ignore the error because it's just the reset, the node might have not been started at all
        this.startNode(this.embark.config.namesystemConfig, cb);
      });
    });
  }

  startNode(namesystemConfig, cb) {
    if (!namesystemConfig.enabled) {
      return cb();
    }
    const nodeName = namesystemConfig.provider;
    if (!nodeName) return cb(__("No namesystem provider specified in configs"));
    const client = this.namesystemNodes[nodeName];
    if (!client) return cb(__("Namesystem client %s not found", nodeName));

    client.startFunction(() => {
      client.started = true;
      cb();
    });
  }

  executeNodeCommand(command, args, cb) {
    const startedNode = Object.values(this.namesystemNodes).find(node => node.started);

    if (!startedNode) {
      return cb(__("No namesystem client started"));
    }

    startedNode.executeCommand(command, args, cb);
  }
}
