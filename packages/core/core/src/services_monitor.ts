import { EmbarkEmitter as Events } from './events';
import { Plugins } from './plugins';

import { __ } from 'embark-i18n';
import { Logger } from 'embark-logger';

export class ServicesMonitor {

  events: Events;

  logger: Logger;

  plugins: Plugins;

  checkList: any = {};

  checkTimers: any = {};

  checkState: any = {};

  working = false;

  constructor(options) {
    this.events = options.events;
    this.logger = options.logger;
    this.plugins = options.plugins;
    this.events.setCommandHandler("services:register", (checkName, checkFn, time, initialStatus) => {
      this.addCheck(checkName, checkFn, time, initialStatus);
    });
  }

  initCheck(checkName) {
    const self = this;
    const check = this.checkList[checkName];

    if (!check) {
      return false;
    }

    self.events.on('check:' + checkName, obj => {
      if (check && check.status === 'off' && obj.status === 'on') {
        self.events.emit('check:backOnline:' + checkName);
      }
      if (check && check.status === 'on' && obj.status === 'off') {
        self.events.emit('check:wentOffline:' + checkName);
      }
      check.status = obj.status;
      // const newState = {name: obj.name, status: obj.status, serviceName: checkName};
      // if (!deepEqual(newState, self.checkState[checkName])) {
      self.checkState[checkName] = {name: obj.name, status: obj.status, serviceName: checkName};
      self.events.emit("servicesState", self.checkState);
      // }
    });

    if (check.interval !== 0) {
      self.checkTimers[checkName] = setInterval(() => {
        check.fn.call(check.fn, obj => {
          self.events.emit('check:' + checkName, obj);
        });
      }, check.interval);
    }

    check.fn.call(check.fn, obj => {
      self.events.emit('check:' + checkName, obj);
    });
  }

  addCheck(checkName, checkFn, time, initialState?: any) {
    this.logger.trace('add check: ' + checkName);
    this.checkList[checkName] = {fn: checkFn, interval: time || 5000, status: initialState};

    if (this.working) {
      this.initCheck(checkName);
    }
  }

  stopCheck(name) {
    clearInterval(this.checkTimers[name]);
    delete this.checkTimers[name];
    delete this.checkList[name];
    delete this.checkState[name];
  }

  startMonitor() {
    const self = this;
    this.working = true;
    this.logger.trace('startMonitor');

    const servicePlugins = this.plugins.getPluginsProperty('serviceChecks', 'serviceChecks');
    servicePlugins.forEach(pluginCheck => {
      self.addCheck(pluginCheck.checkName, pluginCheck.checkFn, pluginCheck.time);
    });

    Object.keys(this.checkList).forEach(checkName => {
      try {
        self.initCheck(checkName);
      } catch (err) {
        self.logger.error(__("error running service check"));
        self.logger.error(err.message);
      }
    });
  }
}
