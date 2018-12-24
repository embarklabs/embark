const version = require("../../package.json");

import { Events as EventsType } from "../typings/embark";
import { Logger as LoggerType } from "../typings/logger";
import { Plugins as PluginsType } from "../typings/plugins";

class Embark {
  private version: string;
  private options: any;
  private events?: EventsType;
  private config?: any;
  private plugins?: PluginsType;
  private logger?: LoggerType;
  // TODO: context is being set directly, this is bad practice and should be fixed
  public context?: any;

  constructor(options: any) {
    this.version = version;
    this.options = options || {};
  }

  public initConfig(env: string, options: any) {
    const Events = require("./core/events.js");
    const Logger = require("./core/logger.js");
    const Config = require("./core/config.js");

    this.events = new Events();
    this.logger = new Logger({logLevel: "debug", events: this.events});

    this.config = new Config({env, logger: this.logger, events: this.events, context: this.context});
    this.config.loadConfigFiles(options);
    this.plugins = this.config.plugins;
  }
}

module.exports = Embark;
