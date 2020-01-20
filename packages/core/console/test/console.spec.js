/*globals describe, it*/
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import Console from '../src/lib';
import { version }  from '../package.json';

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
process.env.DAPP_PATH = 'something';

describe('core/console', () => {

  const { embark, plugins } = fakeEmbark();


  let console;

  beforeEach(() => {
    console = new Console(embark, {
      ipc: embark.config.ipc,
      events: embark.events,
      plugins: embark.plugins,
      logger: embark.logger,
      version
    });
  });

  afterEach(() => {
    embark.teardown();
  });

  it('it should provide a help text', (done) => {
    console.executeCmd('help', (_err, output) => {
      let lines = output.split('\n');
      assert.equal(lines[0], 'Welcome to Embark ' + version);
      assert.equal(lines[2], 'possible commands are:');
      done();
    });
  });
});
