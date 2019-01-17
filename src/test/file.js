/*globals describe, it*/
const File = require('../lib/core/file');
const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');

describe('embark.File', function () {
  describe('parseFileForImport', () => {
    it('should find all the imports', function (done) {
      const contract = fs.readFileSync('./dist/test/contracts/contract_with_import.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/test_app/app/contracts/simple_storage.sol'});
      const downloadFileStub = sinon.stub(file, 'downloadFile')
        .callsFake((path, url, cb) => {
          cb();
        });

      file.parseFileForImport(contract, true, () => {
        assert.strictEqual(downloadFileStub.callCount, 1);
        assert.strictEqual(downloadFileStub.firstCall.args[0],
          path.normalize('.embark/contracts/embark-framework/embark/master/test_app/app/contracts/ownable.sol'));
        assert.strictEqual(downloadFileStub.firstCall.args[1],
          'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/test_app/app/contracts/./ownable.sol');
        done();
      });
    });

    it('should find and add remappings for all recursive imports', function (done) {
      const contract = fs.readFileSync('./dist/test/contracts/recursive_test_0.sol').toString();
      const file = new File({filename: './dist/test/contracts/recursive_test_0.sol',
    path: path.join(__dirname, './contracts/recursive_test_0.sol')});

      file.parseFileForImport(contract, () => {
        assert.deepEqual(file.importRemappings[0], {
          prefix: "./recursive_test_1.sol",
          target: path.join(__dirname, "./contracts/recursive_test_1.sol")
        });
        assert.deepEqual(file.importRemappings[1], {
          prefix: "./recursive_test_2.sol",
          target: path.join(__dirname, "./contracts/recursive_test_2.sol")
        });
        assert.deepEqual(file.importRemappings[2], {
          prefix: "embark-test-contract-0/recursive_test_3.sol",
          target: path.resolve(path.join("node_modules", "./embark-test-contract-0/recursive_test_3.sol"))
        });
        assert.deepEqual(file.importRemappings[3], {
          prefix: "embark-test-contract-1/recursive_test_4.sol",
          target: path.resolve(path.join("node_modules", "./embark-test-contract-1/recursive_test_4.sol"))
        });
        done();
      });
    });

    it('should find all the imports but not call download because not a http contract', function (done) {
      const contract = fs.readFileSync('./dist/test/contracts/contract_with_import.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/test_app/app/contracts/simple_storage.sol'});
      const downloadFileStub = sinon.stub(file, 'downloadFile')
        .callsFake((path, url, cb) => {
          cb();
        });

      file.parseFileForImport(contract, () => {
        assert.strictEqual(downloadFileStub.callCount, 0);
        done();
      });
    });

    it('should find all the imports and call downlaod because it is an http import', function (done) {
      const contract = fs.readFileSync('./dist/test/contracts/contract_with_http_import.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/test_app/app/contracts/simple_storage.sol'});
      const downloadFileStub = sinon.stub(file, 'downloadFile')
        .callsFake((path, url, cb) => {
          cb();
        });

      file.parseFileForImport(contract, () => {
        assert.strictEqual(downloadFileStub.callCount, 1);
        assert.strictEqual(downloadFileStub.firstCall.args[0],
          '.embark/contracts/embark-framework/embark/master/test_apps/contracts_app/contracts/contract_args.sol');
        assert.strictEqual(downloadFileStub.firstCall.args[1],
          'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/contracts_app/contracts/contract_args.sol');
        done();
      });
    });

    it('should find all the imports but only once if called twice', function (done) {
      const contract = fs.readFileSync('./dist/test/contracts/contract_with_http_import.sol').toString();
      const file = new File({filename: '.embark/contracts/embark-framework/embark/master/test_app/app/contracts/simple_storage.sol',
        path: 'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/test_app/app/contracts/simple_storage.sol'});
      const downloadFileStub = sinon.stub(file, 'downloadFile')
        .callsFake((path, url, cb) => {
          cb();
        });

      file.parseFileForImport(contract, () => {
        // Parse again
        file.parseFileForImport(contract, () => {
          assert.strictEqual(downloadFileStub.callCount, 1);
          assert.strictEqual(downloadFileStub.firstCall.args[0],
            '.embark/contracts/embark-framework/embark/master/test_apps/contracts_app/contracts/contract_args.sol');
          assert.strictEqual(downloadFileStub.firstCall.args[1],
            'https://raw.githubusercontent.com/embark-framework/embark/master/test_apps/contracts_app/contracts/contract_args.sol');
          done();
        });
      });
    });
  });
});
