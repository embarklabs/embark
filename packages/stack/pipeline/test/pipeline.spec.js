/* global describe, beforeEach, afterEach, test */
import assert from 'assert';
import sinon from 'sinon';
import { fakeEmbark } from 'embark-testing';
import Pipeline from '../src/';
import path from 'path';

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
const DAPP_PATH = 'something';
process.env.DAPP_PATH = DAPP_PATH;

describe('stack/pipeline', () => {

  const { embark } = fakeEmbark();

  let pipeline;

  beforeEach(() => {
    pipeline = new Pipeline(embark);
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('constructor', () => {
    test('it should assign the correct properties', () => {
      assert.strictEqual(pipeline.events, embark.events);
      assert.strictEqual(pipeline.plugins, embark.plugins);
      assert.strictEqual(pipeline.fs, embark.fs);
    });
    test('it should register command handler for pipeline:generateAll', () => {
      pipeline.events.assert.commandHandlerRegistered("pipeline:generateAll");
    });
    
    test('it should register command handler for pipeline:register', () => {
      pipeline.events.assert.commandHandlerRegistered("pipeline:register");
    });
  });

  describe('methods', () => {
    describe('generateAll', () => {
      let action, file1, file2, eachCb;
      beforeEach(() => {
        action = sinon.spy(pipeline.plugins, "runActionsForEvent");
        file1 = {format: "json"};
        file2 = {format: "other"};
        pipeline.files = {file1, file2};
        eachCb = sinon.fake.yields(null, null);
        sinon.replace(pipeline, 'writeFile', eachCb);
        sinon.replace(pipeline, 'writeJSONFile', eachCb);
      });
      test('it should run before action', () => {
        pipeline.generateAll(() => {});
        assert(action.calledWith("pipeline:generateAll:before", {}));
      });
      test('it should write JSON files', () => {
        pipeline.generateAll(() => {});
        assert(pipeline.writeJSONFile.calledWith(file1));
      });
      test('it should write other files', () => {
        pipeline.generateAll(() => {});
        assert(pipeline.writeFile.calledWith(file2));
      });
      test('it should write no files when none registered', () => {
        pipeline.files = {};
        pipeline.generateAll(() => {});
        assert(pipeline.writeJSONFile.notCalled);
        assert(pipeline.writeFile.notCalled);
      });
      test('it should run after action', () => {
        pipeline.generateAll(() => {});
        assert(action.calledWith("pipeline:generateAll:after", {}));
      });
      test('it should call callback', () => {
        const cb = sinon.spy();
        pipeline.generateAll(cb);
        assert(cb.called);
      });
    });

    describe('writeJSONFile', () => {
      let file1, nextCb;
      beforeEach(() => {
        file1 = {format: "json", path: "path/to/json", content: "file 1 content", file: "nameJson"};
        nextCb = sinon.fake.yields(null, null);
        sinon.replace(pipeline.fs, 'mkdirp', nextCb);
        sinon.replace(pipeline.fs, 'writeJson', nextCb);
      });
      test('it should make directory', () => {
        const dir = path.join(DAPP_PATH, ...file1.path);
        pipeline.writeJSONFile(file1, () => {});
        assert(pipeline.fs.mkdirp.calledWith(dir));
        assert(nextCb.called);
      });
      test('it should write JSON files', () => {
        const filename = path.join(DAPP_PATH, ...file1.path, file1.file);
        pipeline.writeJSONFile(file1, () => {});
        assert(pipeline.fs.writeJson.calledWith(filename, file1.content, {spaces: 2}));
        assert(nextCb.called);
      });
      test('it should call callback', () => {
        const cb = sinon.spy();
        pipeline.writeJSONFile(file1, cb);
        assert(cb.called);
      });
      test('it should bubble error to callback', () => {
        const cb = sinon.spy();
        const error = "error";
        sinon.restore();
        nextCb = sinon.fake.yields(error);
        sinon.replace(pipeline.fs, 'mkdirp', nextCb);
        pipeline.writeJSONFile(file1, cb);
        assert(cb.calledWith(error));
      });
    });
    
    describe('writeFile', () => {
      let file1, nextCb;
      beforeEach(() => {
        file1 = {format: "json", path: "path/to/json", content: "file 1 content", file: "nameJson"};
        nextCb = sinon.fake.yields(null, null);
        sinon.replace(pipeline.fs, 'mkdirp', nextCb);
        sinon.replace(pipeline.fs, 'writeFile', nextCb);
      });
      test('it should make directory', () => {
        const dir = path.join(DAPP_PATH, ...file1.path);
        pipeline.writeFile(file1, () => {});
        assert(pipeline.fs.mkdirp.calledWith(dir));
        assert(nextCb.called);
      });
      test('it should write JSON files', () => {
        const filename = path.join(DAPP_PATH, ...file1.path, file1.file);
        pipeline.writeFile(file1, () => {});
        assert(pipeline.fs.writeFile.calledWith(filename, file1.content));
        assert(nextCb.called);
      });
      test('it should call callback', () => {
        const cb = sinon.spy();
        pipeline.writeFile(file1, cb);
        assert(cb.called);
      });
      test('it should bubble error to callback', () => {
        const cb = sinon.spy();
        const error = "error";
        sinon.restore();
        nextCb = sinon.fake.yields(error);
        sinon.replace(pipeline.fs, 'mkdirp', nextCb);
        pipeline.writeFile(file1, cb);
        assert(cb.calledWith(error));
      });
    });
  });

  describe('implementation', () => {
    describe('register file', () => {
      test('it should register a file', async () => {
        const params = { path: "path/to", file: "file" };
        await pipeline.events.request2("pipeline:register", params);
        pipeline.events.assert.commandHandlerCalledWith("pipeline:register", params);
        
        const filepath = path.join(DAPP_PATH, ...params.path, params.file);
        assert.equal(pipeline.files[filepath], params, "File not added to pipeline files array");
      });
    });
    describe('generate files', () => {
      test('it should run actions for "pipeline:generateAll:before"', async () => {
        const action = (params, cb) => {
          cb();
        };
        pipeline.plugins.registerActionForEvent('pipeline:generateAll:before', action);
        await pipeline.events.request2("pipeline:generateAll");
        pipeline.plugins.assert.actionForEventCalled('pipeline:generateAll:before', action);
      });
      test('it should run actions for "pipeline:generateAll:after"', async () => {
        const action = (params, cb) => {
          cb();
        };
        pipeline.plugins.registerActionForEvent('pipeline:generateAll:after', action);
        await pipeline.events.request2("pipeline:generateAll");
        pipeline.plugins.assert.actionForEventCalled('pipeline:generateAll:after', action);
      });
    });
  });
});

