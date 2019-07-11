const async = require('async');
import { dappPath } from 'embark-utils';

const PipelineAPI = require('./api.js');

// TODO: pipeline should just generate files, but doesn't necessarily know much about them
// specially their structure (i.e doesn't care if it's embarkjs or contracts or storage etc..)

class Pipeline {
  constructor(embark, options) {
    this.embark = embark;
    this.events = embark.events;
    this.logger = embark.config.logger;
    this.plugins = embark.config.plugins;
    this.fs = embark.fs;

    // this.events.setCommandHandler('pipeline:build', (options, callback) => {
    //   if (!this.pipelineConfig.enabled) {
    //     return this.buildContracts([], callback);
    //   }
    //   this.build(options, callback);
    // });
    // this.events.setCommandHandler('pipeline:build:contracts', callback => this.buildContracts([], callback));
    // TODO: action in the constructor, shoudn't be happening..
    // this.fs.removeSync(this.buildDir);

    this.api = new PipelineAPI(embark, options);
    this.api.registerAPIs();

    this.files = {}

    this.events.setCommandHandler('pipeline:generateAll', (cb) => {
      this.generateAll(cb);
    });

    this.events.setCommandHandler('pipeline:register', (params, cb) => {
      this.files[dappPath(...params.path, params.file)] = params;
      if (cb) {
        cb();
      }
    });
  }

  generateAll(cb) {
    console.dir("generating all files");

    async.waterfall([
      (next) => {
        this.plugins.runActionsForEvent("pipeline:generateAll:before", {}, (err) => {
          next(err);
        });
      },
      (next) => {
        // TODO: make this async
        for (let fileParams of Object.values(this.files)) {
          if (fileParams.format === 'json') {
            this.writeJSONFile(fileParams)
          } else {
            this.writeFile(fileParams)
          }
        }
        next();
      },
      (next) => {
        this.plugins.runActionsForEvent("pipeline:generateAll:after", {}, (err) => {
          next(err);
        });
      }
    ], () => {
      cb();
    });
  }

  writeJSONFile(params) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeContractsJSON(next) {
        self.fs.writeJson(filename, content, { spaces: 2 }, () => { next() });
      }
    ], () => {
    });
  }

  writeFile(params) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeFile(next) {
        self.fs.writeFile(filename, content, (err) => { next(err, true) });
      }
    ], () => {
    });
  }

}

module.exports = Pipeline;
