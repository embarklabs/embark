import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import Compiler from '../src/lib/Compiler';

function MockFile(options) {
  this.path = options.path;
  this.type = options.type;
  this.originalPath = options.originalPath;
  this.importRemappings = [];
}

const isMac = process.platform === 'darwin';

describe('plugin/solc', () => {

  let embark, originalCompileSolcContract;

  beforeEach(() => {

    const testBed = fakeEmbark({
      pluginConfig: {
        outputBinary: false
      },
      embarkConfig: {
        options: {
          solc: {}
        }
      },
      contractDirectories: []
    });

    embark = testBed.embark;
    originalCompileSolcContract = Compiler.compileSolcContract;
    Compiler.compileSolcContract = sinon.spy((logger, _settings, _directories, cb) => {
      cb(null, 'compileString');
    });

    MockFile.prototype.prepareForCompilation = sinon.spy(() => Promise.resolve(''));
  });

  afterEach(() => {
    Compiler.compileSolcContract = originalCompileSolcContract;
    embark.teardown();
    sinon.restore();
  });

  it('should ensure testsuite has at least one test', () => {
    expect(true).toBe(true);
  });

  // TODO(pascal):
  // Remove this condition once there's a `solc` binary provided by the
  // solidity project. We need to turn off tests for Mac on CI because
  // we don't install `solc` on that platform. Reason being is that it
  // takes too long to install via brew.
  if (!isMac) {
    it('should get solc version', () => {
      return new Promise(done => {
        Compiler.getSolcVersion(embark.logger, (err, version) => {
          assert(version);
          done();
        });
      });
    });

    it('should compile solc contract', () => {
      const EMPTY_TEST_CONTRACT = `
      pragma solidity ^0.6.0;

      contract TestContract {

      }
      `;

      MockFile.prototype.prepareForCompilation = sinon.spy(_isCoverage => {
        return Promise.resolve(EMPTY_TEST_CONTRACT);
      });

      let mockFile = new MockFile({
        type: 'dapp_file',
        path: 'test_file.sol',
        originalPath: 'test_file.sol'
      });

      const contractFiles = [mockFile];

      const contractDirectories = ['contracts'];
      const options = {};

      return new Promise(done => {
        Compiler.compileSolc(embark, contractFiles, contractDirectories, options, (err, result) => {
          assert(mockFile.prepareForCompilation.called);

          assert(result.TestContract);
          assert(result.TestContract.code);
          assert(result.TestContract.runtimeBytecode);
          assert(result.TestContract.realRuntimeBytecode);
          assert(result.TestContract.swarmHash);
          done();
        });
      });
    });

    it('should emit error when compilation fails', () => {

      const ERROR_CONTRACT = `

      ontract ErrorContract {

      }
      `;

      MockFile.prototype.prepareForCompilation = sinon.spy(_isCoverage => {
        return Promise.resolve(ERROR_CONTRACT);
      });

      let mockFile = new MockFile({
        type: 'dapp_file',
        path: 'test_file.sol',
        originalPath: 'test_file.sol'
      });

      const contractFiles = [mockFile];

      const contractDirectories = ['contracts'];
      const options = {};

      return new Promise(done => {
        Compiler.compileSolc(embark, contractFiles, contractDirectories, options, (err, _result) => {
          assert(err);
          done();
        });
      });
    });
  }
});
