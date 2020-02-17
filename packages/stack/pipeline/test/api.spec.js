/* global describe, beforeEach, afterEach, test */
import assert from 'assert';
import sinon from 'sinon';
import { fakeEmbark } from 'embark-testing';
import API from '../src/api';
import path from 'path';

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
const DAPP_PATH = 'something';
process.env.DAPP_PATH = DAPP_PATH;

describe('stack/pipeline/api', () => {

  const { embark } = fakeEmbark();

  let pipelineApi;

  beforeEach(() => {
    pipelineApi = new API(embark);
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('constructor', () => {
    test('it should assign the correct properties', () => {
      assert.strictEqual(pipelineApi.plugins, embark.plugins);
      assert.strictEqual(pipelineApi.fs, embark.fs);
    });
  });

  describe('methods', () => {
    describe('apiGuardBadFile', () => {
      let pathToCheck;
      const pathToFile = "/path/to/file";
      const error = { message: 'Path is invalid' };
      beforeEach(() => {
        pathToCheck = path.join(DAPP_PATH, pathToFile);
      });
      test('it should throw when file doesn\'t exist and is expected to exist', () => {
        const options = { ensureExists: true };
        const existsSync = sinon.fake.returns(false);
        sinon.replace(pipelineApi.fs, 'existsSync', existsSync);
        assert.throws(() => pipelineApi.apiGuardBadFile(pathToCheck, options), error);
      });
      test('it should not throw when file exists and is expected to exist', () => {
        const options = { ensureExists: true };
        const existsSync = sinon.fake.returns(true);
        sinon.replace(pipelineApi.fs, 'existsSync', existsSync);
        assert.doesNotThrow(() => pipelineApi.apiGuardBadFile(pathToCheck, options));
      });
      test('it should throw when file is not in the dappPath', () => {
        assert.throws(() => pipelineApi.apiGuardBadFile(pathToFile), error);
      });
      test('it should not throw when file is in the dappPath', () => {
        assert.doesNotThrow(() => pipelineApi.apiGuardBadFile(pathToCheck));
      });
    });

    describe('registerAPIs', () => {
      describe('GET /embark-api/file', () => {
        let req, readFileSync;
        const method = "GET";
        const endpoint = "/embark-api/file";
        const filepath = path.join(DAPP_PATH, "/path/to/file");
        beforeEach(() => {
          req = { path: filepath };
          readFileSync = sinon.stub().returns("content");
          pipelineApi.fs = { readFileSync };

          pipelineApi.registerAPIs();
        });

        test(`it should register ${method} ${endpoint}`, () => {
          pipelineApi.plugins.assert.apiCallRegistered(method, endpoint);
        });
        test('it should throw error when guarding bad files', async () => {
          const error = "testing error";
          pipelineApi.apiGuardBadFile = sinon.stub().throws(new Error(error));
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(resp.send.calledWith({ error }));
        });
        test('it should return a file', async () => {
          pipelineApi.apiGuardBadFile = sinon.stub().returns();
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(readFileSync.calledWith(filepath, 'utf8'));
          assert(resp.send.calledWith({ name: "file", content: "content", path: filepath }));
        });
      });

      describe('POST /embark-api/folders', () => {
        let req, mkdirpSync;
        const method = "POST";
        const endpoint = "/embark-api/folders";
        const filepath = path.join(DAPP_PATH, "/path/to/folder");
        beforeEach(() => {
          req = { path: filepath };
          mkdirpSync = sinon.stub();
          pipelineApi.fs = { mkdirpSync };

          pipelineApi.registerAPIs();
        });

        test(`it should register ${method} ${endpoint}`, () => {
          pipelineApi.plugins.assert.apiCallRegistered(method, endpoint);
        });
        test('it should throw error when guarding bad files', async () => {
          const error = "testing error";
          pipelineApi.apiGuardBadFile = sinon.stub().throws(new Error(error));
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(resp.send.calledWith({ error }));
        });
        test('it should create a folder', async () => {
          pipelineApi.apiGuardBadFile = sinon.stub().returns();
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(mkdirpSync.calledWith(filepath));
          assert(resp.send.calledWith({ name: "folder", path: filepath }));
        });
      });

      describe('POST /embark-api/files', () => {
        let req, writeFileSync;
        const method = "POST";
        const endpoint = "/embark-api/files";
        const filepath = path.join(DAPP_PATH, "/path/to/file");
        beforeEach(() => {
          req = { path: filepath, content: "content" };
          writeFileSync = sinon.stub();
          pipelineApi.fs = { writeFileSync };

          pipelineApi.registerAPIs();
        });

        test(`it should register ${method} ${endpoint}`, () => {
          pipelineApi.plugins.assert.apiCallRegistered(method, endpoint);
        });
        test('it should throw error when guarding bad files', async () => {
          const error = "testing error";
          pipelineApi.apiGuardBadFile = sinon.stub().throws(new Error(error));
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(resp.send.calledWith({ error }));
        });
        test('it should write a file to the filesystem', async () => {
          pipelineApi.apiGuardBadFile = sinon.stub().returns();
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(writeFileSync.calledWith(req.path, req.content, { encoding: 'utf8' }));
          assert(resp.send.calledWith({ name: "file", ...req }));
        });
      });

      describe('DELETE /embark-api/file', () => {
        let req, removeSync;
        const method = "DELETE";
        const endpoint = "/embark-api/file";
        const filepath = path.join(DAPP_PATH, "/path/to/file");
        beforeEach(() => {
          req = { path: filepath, content: "content" };
          removeSync = sinon.stub();
          pipelineApi.fs = { removeSync };

          pipelineApi.registerAPIs();
        });

        test(`it should register ${method} ${endpoint}`, () => {
          pipelineApi.plugins.assert.apiCallRegistered(method, endpoint);
        });
        test('it should throw error when guarding bad files', async () => {
          const error = "testing error";
          pipelineApi.apiGuardBadFile = sinon.stub().throws(new Error(error));
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(resp.send.calledWith({ error }));
        });
        test('it should delete a file from the filesystem', async () => {
          pipelineApi.apiGuardBadFile = sinon.stub().returns();
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          assert(removeSync.calledWith(req.path));
          assert(resp.send.called);
        });
      });

      describe('GET /embark-api/files', () => {
        let req, readdirSync, statSync;
        const method = "GET";
        const endpoint = "/embark-api/files";
        const file = "file";
        const fileHidden = ".file";
        const folder = "folder";
        const child = "child";
        beforeEach(() => {
          req = {};
          readdirSync = sinon.stub();
          readdirSync.withArgs(DAPP_PATH).returns([
            file,
            fileHidden,
            folder
          ]);
          readdirSync.withArgs(path.join(DAPP_PATH, folder)).returns([child]);

          statSync = sinon.stub();
          statSync.returns({ isDirectory: () => false });
          statSync.withArgs(path.join(DAPP_PATH, folder)).returns({ isDirectory: () => true });

          pipelineApi.fs = { readdirSync, statSync };

          pipelineApi.registerAPIs();
        });

        test(`it should register ${method} ${endpoint}`, () => {
          pipelineApi.plugins.assert.apiCallRegistered(method, endpoint);
        });
        test('it should return a tree of file objects for the dapp', async () => {
          const resp = await pipelineApi.plugins.mock.apiCall(method, endpoint, req);
          const expectedValue = [
            {
              isRoot: true,
              name: 'folder',
              dirname: 'something',
              path: path.join(DAPP_PATH, folder),
              isHidden: false,
              children: [
                {
                  name: 'child',
                  isRoot: false,
                  path: path.join(DAPP_PATH, folder, child),
                  dirname: path.join(DAPP_PATH, folder),
                  isHidden: false
                }
              ]
            },
            {
              name: '.file',
              isRoot: true,
              path: path.join(DAPP_PATH, fileHidden),
              dirname: 'something',
              isHidden: true
            },
            {
              name: 'file',
              isRoot: true,
              path: path.join(DAPP_PATH, file),
              dirname: 'something',
              isHidden: false
            }
          ];
          assert(resp.send.calledWith(expectedValue));
        });
      });
    });

  });
});
