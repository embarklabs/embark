const async = require('async');
import { dappPath } from 'embark-utils';

const PipelineAPI = require('./api.js');

class Pipeline {
  constructor(embark, options) {
    this.events = embark.events;
    this.plugins = embark.config.plugins;
    this.fs = embark.fs;
    this.files = {};

    this.api = new PipelineAPI(embark, options);
    this.api.registerAPIs();

    this.events.setCommandHandler('pipeline:generateAll', this.generateAll.bind(this));

    this.events.setCommandHandler('pipeline:register', (params, cb) => {
      this.files[dappPath(...params.path, params.file)] = params;
      if (cb) { cb(); }
    });
  }

  generateAll(cb) {
    async.waterfall([
      (next) => {
        this.plugins.runActionsForEvent("pipeline:generateAll:before", {}, (err) => {
          next(err);
        });
      },
      (next) => {
        // TODO: make this async
        async.each(Object.values(this.files), (fileParams, eachCb) => {
          if (fileParams.format === 'json') {
            return this.writeJSONFile(fileParams, eachCb);
          }
          this.writeFile(fileParams, eachCb);
        }, next);
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

  writeJSONFile(params, cb) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeContractsJSON(next) {
        self.fs.writeJson(filename, content, { spaces: 2 }, (e) => { next(e); });
      }
    ], cb);
  }

  // TODO: can be refactored by joining with method above
  writeFile(params, cb) {
    const self = this;
    const dir = dappPath(...params.path);
    const filename = dappPath(...params.path, params.file);
    const content = params.content;

    async.waterfall([
      function makeDirectory(next) {
        self.fs.mkdirp(dir, err => next(err));
      },
      function writeFile(next) {
        self.fs.writeFile(filename, content, (err) => { next(err); });
      }
    ], cb);
  }

}

module.exports = Pipeline;
