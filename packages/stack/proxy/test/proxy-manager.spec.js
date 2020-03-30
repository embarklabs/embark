import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import ProxyManager from '../src';
import { Proxy } from '../src/proxy';

const mockRequestManager = {
  send: (request, cb) => {
    return new Promise(resolve => {
      if (cb) {
        cb(null, {});
      }
      resolve();
    });
  }
};

describe('stack/proxy', () => {

  let proxyManager, embark;

  beforeEach(() => {
    const testBed = fakeEmbark({
      blockchainConfig: {
        proxy: {}
      }
    });

    embark = testBed.embark;

    proxyManager = new ProxyManager(embark, {
      plugins: testBed.embark,
      requestManager: mockRequestManager
    });
  });

  afterEach(async () => {
    await proxyManager.stopProxy();
    embark.teardown();
    sinon.restore();
  });

  describe('instantiation', () => {

    it('should register proxy:endpoint:get command handler', () => {
      embark.events.assert.commandHandlerRegistered('proxy:endpoint:get');
    });
  });

  it('should return default proxy endpoint', async () => {
    const endpoint = await embark.events.request2('proxy:endpoint:get');
    assert.equal(endpoint, 'ws://localhost:8556');
  });

  it('should initialize', async () => {
    await proxyManager.init();
    assert(proxyManager.inited);
    assert.equal(proxyManager.rpcPort, 8555);
    assert.equal(proxyManager.wsPort, 8556);
    assert(proxyManager.isWs);
  });

  it('should setup proxy', async () => {
    embark.events.setCommandHandler('blockchain:node:provider', (cb) => {
      cb({});
    });
    await proxyManager.setupProxy();
    assert(proxyManager.httpProxy instanceof Proxy);
    assert(proxyManager.wsProxy instanceof Proxy);
  });

  it('should stop proxy', async () => {
    const stopSpy = sinon.spy(cb => cb());

    proxyManager.wsProxy = {
      stop: stopSpy
    };

    proxyManager.httpProxy = {
      stop: stopSpy
    };

    await proxyManager.stopProxy();
    assert(stopSpy.calledTwice);
    assert.equal(proxyManager.wsProxy, null);
    assert.equal(proxyManager.httpProxy, null);
  });
});
