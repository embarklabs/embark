import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import Storage from '../src';

describe('stack/storage', () => {

  let storage, embark;

  beforeEach(() => {
    const testBed = fakeEmbark({
      storageConfig: {
        dappConnection: {
          foo: 'bar'
        }
      },
      embarkConfig: {
        generationDir: 'foo'
      }
    });

    embark = testBed.embark;
    storage = new Storage(embark, { plugins: testBed.plugins });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });


  describe('instantiation', () => {

    it('should register storage:node:register command handler', () => {
      storage.events.assert.commandHandlerRegistered('storage:node:register');
    });

    it('should register storage:node:start command handler', () => {
      storage.events.assert.commandHandlerRegistered('storage:node:start');
    });

    it('should register storage:upload:register command handler', () => {
      storage.events.assert.commandHandlerRegistered('storage:upload:register');
    });

    it('should register storage:upload command handler', () => {
      storage.events.assert.commandHandlerRegistered('storage:upload');
    });
  });

  it('should register a node', () => {

    const startFunction = sinon.fake();

    embark.events.request('storage:node:register', 'testNode', startFunction);
    assert(storage.storageNodes['testNode']);
    assert.equal(storage.storageNodes['testNode'], startFunction);
  });

  it('should start registered node', done => {

    const startFunction = sinon.spy(cb => cb());

    const storageConfig = {
      enabled: true,
      upload: {
        provider: 'testProvider'
      }
    };

    embark.events.request('storage:node:register', 'testProvider', startFunction);
    embark.events.request('storage:node:start', storageConfig, () => {
      assert(startFunction.calledOnce);
      done();
    });
  });

  it('should not start node if storage is disabled', done => {

    const startFunction = sinon.spy(cb => cb());

    const storageConfig = {
      enabled: false,
      upload: {
        provider: 'testProvider'
      }
    };

    embark.events.request('storage:node:register', 'testProvider', startFunction);
    embark.events.request('storage:node:start', storageConfig, () => {
      assert(!startFunction.calledOnce);
      done();
    });
  });

  it('should register an upload node', () => {

    const uploadFn = sinon.fake();

    embark.events.request('storage:upload:register', 'testNode', uploadFn);
    assert(storage.uploadNodes['testNode']);
    assert.equal(storage.uploadNodes['testNode'], uploadFn);
  });

  it('should upload data using registerd upload function', done => {

    const uploadFn = sinon.spy(cb => cb());

    embark.events.request('storage:upload:register', 'testNode', uploadFn);
    embark.events.request('storage:upload', 'testNode', () => {
      assert(uploadFn.calledOnce);
      done();
    });
  });

  it('should register action for pipeline:generateAll:before', done => {
    const pipelineRegisterHandler = sinon.spy((params, cb) => cb());
    embark.events.setCommandHandler('pipeline:register', pipelineRegisterHandler);
    embark.plugins.runActionsForEvent('pipeline:generateAll:before', () => {
      assert(pipelineRegisterHandler.calledOnce);
      done();
    });
  });
});

