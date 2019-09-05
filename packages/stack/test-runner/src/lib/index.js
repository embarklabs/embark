import { __ } from 'embark-i18n';
const async = require('async');
const chalk = require('chalk');
const path = require('path');
const { dappPath } = require('embark-utils');
import { COVERAGE_GAS_LIMIT, GAS_LIMIT } from './constants';

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

    this.events.setCommandHandler('tests:run', (options, callback) => {
      this.run(options, callback);
    });

    this.events.setCommandHandler('tests:runner:register', (pluginName, matchFn, addFn, runFn) => {
      // We unshift to give priority to runners registered after the default ones, making it
      // possible to override the ones Embark ships with. This will open the door for things
      // like Jest tests and such.
      this.runners.unshift({pluginName, matchFn, addFn, runFn});
    });
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
      },
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
      } catch(err) {
        process.stdout.write(chalk`{red Coverage report could not be created:}\n{white ${err.message}}\n`);
        cb(err, reporter.passes, reporter.fails);
      }
    });
  }

  generateCoverageReport() {
    const coveragePath = dappPath(".embark", "coverage.json");
    const coverageMap = JSON.parse(fs.readFileSync(coveragePath));
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
}

module.exports = TestRunner;
