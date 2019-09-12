import { __ } from 'embark-i18n';
import {buildUrl, deconstructUrl, recursiveMerge} from "embark-utils";
const async = require('async');
const chalk = require('chalk');
const path = require('path');
const { dappPath } = require('embark-utils');
import cloneDeep from "lodash.clonedeep";
import { COVERAGE_GAS_LIMIT, GAS_LIMIT } from './constants';
const constants = require('embark-core/constants');

const coverage = require('istanbul-lib-coverage');
const reporter = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const Reporter = require('./reporter');

class TestRunner {
  constructor(embark, options) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;
    this.fs = embark.fs;
    this.ipc = options.ipc;
    this.runners = [];
    this.gasLimit = options.coverage ? COVERAGE_GAS_LIMIT : GAS_LIMIT;
    this.files = [];

    this.configObj = embark.config;
    this.originalConfigObj = cloneDeep(embark.config);
    this.simOptions = {};

    this.events.setCommandHandler('tests:run', (options, callback) => {
      this.run(options, callback);
    });

    this.events.setCommandHandler('tests:runner:register', (pluginName, matchFn, addFn, runFn) => {
      // We unshift to give priority to runners registered after the default ones, making it
      // possible to override the ones Embark ships with. This will open the door for things
      // like Jest tests and such.
      this.runners.unshift({pluginName, matchFn, addFn, runFn});
    });

    this.events.setCommandHandler('tests:deployment:check', this.checkDeploymentOptions.bind(this));
    this.events.setCommandHandler('tests:blockchain:start', this.startBlockchainNode.bind(this));
  }

  run(options, cb) {
    const reporter = new Reporter(this.embark);
    const testPath = options.file || "test";

    async.waterfall([
      (next) => {
        this.getFilesFromDir(testPath, next);
      },
      (files, next) => {
        for(const file of files) {
          const runner = this.runners.find(r => r.matchFn(file));

          if (!runner) {
            this.logger.warn(`No runners registered for '${file}'`);
            continue;
          }

          runner.addFn(file);
        }

        next();
      },
      (next) => {
        reporter.header();

        options.reporter = reporter;
        const runnerFns = this.runners.map((runner) => {
          return (_cb) => { runner.runFn(options, _cb); };
        });

        async.series(runnerFns, next);
      }
    ], (err) => {
      reporter.footer();

      if (!options.coverage) {
        return cb(err, reporter.passes, reporter.fails);
      }

      try {
        this.generateCoverageReport();
        process.stdout.write(chalk`{blue Coverage report created. You can find it here:}\n{white.underline ${dappPath('coverage/index.html')}}\n`);

        if (options.noBrowser) {
          return cb(err, reporter.passes, reporter.fails);
        }

        const open = require('open');
        open(dappPath('coverage/index.html')).then(() => {
          cb(err, reporter.passes, reporter.fails);
        });
      } catch(e) {
        process.stdout.write(chalk`{red Coverage report could not be created:}\n{white ${e.message}}\n`);
        cb(e, reporter.passes, reporter.fails);
      }
    });
  }

  generateCoverageReport() {
    const coveragePath = dappPath(".embark", "coverage.json");
    const coverageMap = JSON.parse(this.fs.readFileSync(coveragePath));
    const map = coverage.createCoverageMap(coverageMap);
    const tree = reporter.summarizers.nested(map);

    const ctx = reporter.createContext({ dir: 'coverage' });
    const report = reports.create('html', { skipEmpty: false, skipFull: false });

    tree.visit(report, ctx);
  }

  getFilesFromDir(filePath, cb) {
    const {fs} = this;

    fs.stat(filePath, (err, fileStat) => {
      const errorMessage = `File "${filePath}" doesn't exist or you don't have permission to it`.red;
      if (err) {
        return cb(errorMessage);
      }
      let isDirectory = fileStat.isDirectory();
      if (isDirectory) {
        return fs.readdir(filePath, (err, files) => {
          if (err) {
            return cb(err);
          }
          async.map(files, (file, _cb) => {
            this.getFilesFromDir(path.join(filePath, file), _cb);
          }, (err, arr) => {
            if (err) {
              return cb(errorMessage);
            }
            cb(null, arr.reduce((a,b) => a.concat(b), []));
          });
        });
      }
      cb(null, [filePath]);
    });
  }

  async checkDeploymentOptions(config, options, cb = () => {}) {
    let resetServices = false;
    const blockchainConfig = config.blockchain || {};
    let {host, port, type, protocol} = blockchainConfig.endpoint ? deconstructUrl(blockchainConfig.endpoint) : {};
    const accounts = blockchainConfig.accounts;

    if (host && port && !['rpc', 'ws'].includes(type)) {
      return cb(__("contracts config error: unknown deployment type %s", type));
    }

    if (!type) {
      type = constants.blockchain.vm;
    }

    if (accounts || port !== this.simOptions.port || type !== this.simOptions.type || host !== this.simOptions.host) {
      resetServices = true;
    }

    Object.assign(this.simOptions, {host, port, type, protocol, accounts, client: config.blockchain && config.blockchain.client});

    if (!resetServices) {
      return cb();
    }

    const provider = await this.startBlockchainNode(options);
    cb(null, provider);
    return provider;
  }

  async startBlockchainNode(options, cb = () => {}) {
    let node = options.node;
    if (!this.simOptions.host && (node && node === constants.blockchain.vm)) {
      this.simOptions.type = constants.blockchain.vm;
      this.simOptions.client = constants.blockchain.vm;
    } else if (this.simOptions.host || (node && node !== constants.blockchain.vm)) {
      let options = this.simOptions;
      if (node && node !== constants.blockchain.vm) {
        options = deconstructUrl(node);
      }

      if (!options.protocol) {
        options.protocol = (options.type === "rpc") ? 'http' : 'ws';
      }
      Object.assign(this.simOptions, options);
      node = null;
    }

    this.configObj.blockchainConfig = recursiveMerge({}, this.originalConfigObj.blockchainConfig, {
      endpoint: this.simOptions.host ? buildUrl(this.simOptions.protocol, this.simOptions.host, this.simOptions.port, this.simOptions.type) : null,
      type: this.simOptions.type,
      accounts: this.simOptions.accounts,
      coverage: options.coverage
    });
    if (this.simOptions.client) {
      this.configObj.blockchainConfig.client = this.simOptions.client;
    }
    this.logger.trace('Setting blockchain configs:', this.configObj.blockchainConfig);
    await this.events.request2('config:blockchainConfig:set', this.configObj.blockchainConfig);

    try {
      await this.events.request2("blockchain:node:stop");
    } catch (e) {
      // Nothing to do here, the node probably wasn't even started
    }

    await this.events.request2("blockchain:node:start", this.configObj.blockchainConfig);
    const provider = await this.events.request2("blockchain:client:provider", "ethereum");
    cb(null, provider);
    return provider;
  }
}

module.exports = TestRunner;
