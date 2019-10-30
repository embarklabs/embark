/*globals describe, it*/
import Console from '../lib';
import { Logger } from 'embark-logger';
import { joinPath, setUpEnv } from 'embark-utils';
import assert from 'assert';
import { version }  from '../../package.json';

setUpEnv(joinPath(__dirname, '../../../../embark'));

describe('embark.Console', function() {
  let logger = new Logger({logLevel: 'error'});
  let ipc = {
    isServer: () => { return true; },
    broadcast: () => {},
    on: () => {},
    isClient: () => { return false; }
  };
  let events = {once: () => {}, setCommandHandler: () => {}, emit: () => {}, on: () => {}, request: () => {}};
  let plugins = {
    logger: logger,
    createPlugin: () => { return {registerAPICall: () => {}}; },
    getPluginsProperty: () => { return []; }
  };
  let embarkObject = {
    registerAPICall: () => {},
    events: events,
    logger: plugins.logger,
    fs: {
      existsSync: () => { return false; },
      dappPath: () => { return "ok"; }
    },
    registerConsoleCommand: (_cmd, _opt) => {},
    embarkConfig: {
      options: {
        solc: {
          "optimize": true,
          "optimize-runs": 200
        }
      }
    }
  };
  let console = new Console(embarkObject, {plugins, version, ipc, events, logger});

  describe('#executeCmd', function() {

    describe('command: help', function() {

      it('it should provide a help text', function(done) {
        console.executeCmd('help', function(_err, output) {
          let lines = output.split('\n');
          assert.equal(lines[0], 'Welcome to Embark ' + version);
          assert.equal(lines[2], 'possible commands are:');
          done();
        });
      });
    });
  });
});
