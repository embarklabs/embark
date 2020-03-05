import sinon from 'sinon';
import assert from 'assert';
import path from 'path';
import { fakeEmbark } from 'embark-testing';
import ScriptsRunnerPlugin, { ScriptsRunnerCommand } from '../src/';
import { file as tmpFile, dir as tmpDir } from 'tmp-promise';
import { promises } from 'fs';

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["assert", "expect"] }] */

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
process.env.DAPP_PATH = 'something';

async function prepareScriptFile(content, dir) {
  const file = await tmpFile({ postfix: '.js', dir});
  await promises.writeFile(file.path, content);
  return file;
}

const web3Mock = {
  eth: {
    getBlock: sinon.spy((_number, _flag) => 'testhash')
  }
};

describe('plugins/scripts-runner', () => {

  // eslint-disable-next-line no-unused-vars
  let scriptRunner,
      testTracker,
      runCodeCommandHandler,
      blockchainClientProviderCommandHandler,
      contractsListCommandHandler,
      embark;

  beforeEach(async () => {
    const testBed = fakeEmbark({
      contractsConfig: {
      },
      embarkConfig: {
        migrations: 'migrations'
      }
    });

    testTracker = {
      web3: web3Mock,
      ensureTrackingFile: sinon.spy((_hash, _env) => {}),
      track: sinon.spy(_config => {}),
      isTracked: sinon.spy(() => false),
      setWeb3: sinon.spy(_web3 => {})
    };


    embark = testBed.embark;
    scriptRunner = new ScriptsRunnerPlugin(embark, { tracker: testTracker });

    runCodeCommandHandler = sinon.spy((code, cb) => {
      // `ScriptsRunnerPlugin` requests code evaluation two times.
      //  It expects a boolean for the first one and an object for
      //  the second one.
      if (code.indexOf('!==') > 0) {
        cb(null, true);
      }
      cb(null, {});
    });

    blockchainClientProviderCommandHandler = sinon.spy((name, cb) => {
      cb(null, 'http://localhost:8545');
    });

    contractsListCommandHandler = sinon.spy(cb => {
      cb(null, [
        { className: 'SimpleStorage' },
        { className: 'AnotherOne' },
        { className: 'Foo' }
      ]);
    });

    embark.events.setCommandHandler('contracts:list', contractsListCommandHandler);
    embark.events.setCommandHandler('runcode:eval', runCodeCommandHandler);
    embark.events.setCommandHandler('blockchain:client:provider', blockchainClientProviderCommandHandler);
    await embark.events.request2(ScriptsRunnerCommand.Initialize);
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  it('should execute script', async () => {
    const scriptFile = await prepareScriptFile(`module.exports = () => { return 'done'; }`);

    return new Promise(done => {
      embark.events.request(ScriptsRunnerCommand.Execute, scriptFile.path, false, (err, result) => {
        assert.equal(result, 'done');
        scriptFile.cleanup();
        done();
      });
    });
  });

  it('should execute all scripts in a directory', async () => {
    const scriptsDir = await tmpDir();

    // eslint-disable-next-line no-unused-vars
    const scriptFile1 = await prepareScriptFile(
      `module.exports = () => { return 'done' }`,
      scriptsDir.path
    );

    // eslint-disable-next-line no-unused-vars
    const scriptFile2 = await prepareScriptFile(
      `module.exports = () => { return 'done2' }`,
      scriptsDir.path
    );

    return new Promise(done => {
      embark.events.request(ScriptsRunnerCommand.Execute, scriptsDir.path, false, (err, result) => {
        assert.ok(result.includes('done'));
        assert.ok(result.includes('done2'));
        scriptsDir.cleanup();
        done();
      });
    });
  });

  it('should force track scripts if --track option is applied', async () => {
    const scriptFile = await prepareScriptFile(`module.exports = () => { return 'done'; }`);

    const expectedResult = {
      scriptName: path.basename(scriptFile.path),
      scriptDirectory: path.basename(path.dirname(scriptFile.path)),
      forceTracking: true
    };

    return new Promise(done => {
      embark.events.request(ScriptsRunnerCommand.Execute, scriptFile.path, true, (err, result) => {
        assert.equal(result, 'done');
        assert(testTracker.track.calledOnce);
        assert(testTracker.track.calledWith(expectedResult));
        scriptFile.cleanup();
        done();
      });
    });
  });

  it('should track automatically if script directory equals migrations directory', async () => {
    const scriptsDir = await tmpDir();
    const migrationsDir = path.join(scriptsDir.path, embark.config.embarkConfig.migrations);

    await promises.mkdir(migrationsDir);

    const scriptFile = await prepareScriptFile(
      `module.exports = () => { return 'done' }`,
      migrationsDir
    );

    const expectedResult = {
      scriptName: path.basename(scriptFile.path),
      scriptDirectory: path.basename(migrationsDir),
      forceTracking: false
    };

    return new Promise(done => {
      embark.events.request(ScriptsRunnerCommand.Execute, scriptFile.path, false, (err, result) => {
        assert.equal(result, 'done');
        assert(testTracker.track.calledOnce);
        assert(testTracker.track.calledWith(expectedResult));
        done();
      });
    });
  });

  it('should not execute script if it was tracked', async() => {
    const scriptFile = await prepareScriptFile(`module.exports = () => { return 'done'; }`);

    return new Promise(done => {
      embark.events.request(ScriptsRunnerCommand.Execute, scriptFile.path, true, (err, result) => {
        assert.equal(result, undefined);
        done();
      });
    });
  });
});
