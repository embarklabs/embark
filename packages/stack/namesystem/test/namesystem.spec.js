import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark, Plugins } from 'embark-testing';
import Namesystem from '../src';

describe('stack/namesystem', () => {

  let namesystem, embark;

  beforeEach(() => {
    const testBed = fakeEmbark({
      namesystemConfig: {
        provider: 'testNode',
        enabled: true
      }
    });

    embark = testBed.embark;
    namesystem = new Namesystem(embark);
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('instantiation', () => {

    it('should register namesystem:node:register command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('namesystem:node:register');
    });

    it('should register namesystem:node:start command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('namesystem:node:start');
    });

    it('should register namesystem:resolve command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('namesystem:resolve');
    });

    it('should register namesystem:lookup command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('namesystem:lookup');
    });

    it('should register namesystem:registerSubdomain command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('namesystem:registerSubdomain');
    });

    it('should register module:namesystem:reset command handler', () => {
      namesystem.events.assert.commandHandlerRegistered('module:namesystem:reset');
    });
  });


  it('should register node', () => {

    const startFunction = sinon.fake();
    const executeCommand = sinon.fake();

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    assert(namesystem.namesystemNodes['testNode']);
    assert.equal(namesystem.namesystemNodes['testNode'].started, false);
  });

  it('should start registered node', done => {

    const startFunction = sinon.spy(cb => cb());
    const executeCommand = sinon.fake();

    const namesystemConfig = {
      provider: 'testNode',
      enabled: true
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    embark.events.request('namesystem:node:start', namesystemConfig, err => {
      assert(startFunction.calledOnce);
      assert.equal(namesystem.namesystemNodes['testNode'].started, true);
      done();
    });
  });

  it('should not start node if namesystem is disabled', done => {

    const startFunction = sinon.fake();
    const executeCommand = sinon.fake();

    const namesystemConfig = {
      provider: 'testNode',
      enabled: false
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    embark.events.request('namesystem:node:start', namesystemConfig, err => {
      assert(!startFunction.calledOnce);
      done();
    });
  });

  it('should resolve name using registered node', async () => {

    const startFunction = sinon.spy(cb => cb());
    const executeCommand = sinon.spy((method, args, cb) => cb());

    const namesystemConfig = {
      provider: 'testNode',
      enabled: true
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    await embark.events.request2('namesystem:node:start', namesystemConfig);

    await embark.events.request2('namesystem:resolve', 'someName');
    assert(executeCommand.calledOnce);
    assert(executeCommand.calledWith('resolve', ['someName']));
  });

  it('should lookup address using registered node', async () => {

    const startFunction = sinon.spy(cb => cb());
    const executeCommand = sinon.spy((method, args, cb) => cb());

    const namesystemConfig = {
      provider: 'testNode',
      enabled: true
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    await embark.events.request2('namesystem:node:start', namesystemConfig);

    await embark.events.request2('namesystem:lookup', '0x000');
    assert(executeCommand.calledOnce);
    assert(executeCommand.calledWith('lookup', ['0x000']));
  });

  it('should register subdomain using registered node', async () => {

    const startFunction = sinon.spy(cb => cb());
    const executeCommand = sinon.spy((method, args, cb) => cb());

    const namesystemConfig = {
      provider: 'testNode',
      enabled: true
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    await embark.events.request2('namesystem:node:start', namesystemConfig);

    await embark.events.request2('namesystem:registerSubdomain', 'someName', '0x000');
    assert(executeCommand.calledOnce);
    assert(executeCommand.calledWith('registerSubdomain', ['someName', '0x000']));
  });

  it('should reset namesystem', async () => {

    const startFunction = sinon.spy(cb => cb());
    const executeCommand = sinon.spy((method, args, cb) => cb());

    const namesystemConfig = {
      provider: 'testNode',
      enabled: true
    };

    embark.events.request('namesystem:node:register', 'testNode', startFunction, executeCommand);
    await embark.events.request2('namesystem:node:start', namesystemConfig);

    await embark.events.request2('module:namesystem:reset');
    assert(executeCommand.calledOnce);
    assert(executeCommand.calledWith('reset', []));
    assert(startFunction.calledTwice);
  });
});

