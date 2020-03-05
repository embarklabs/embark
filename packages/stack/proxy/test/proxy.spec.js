import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import { Proxy } from '../src/proxy';

describe('stack/proxy', () => {

  let proxy, embark, mockWs;

  beforeEach(() => {

    const testBed = fakeEmbark();
    embark = testBed.embark;

    proxy = new Proxy({
      plugins: embark.plugins,
      logger: embark.logger,
      events: embark.events,
      isWs: true
    });

    mockWs = {
      OPEN: 1,
      readyState: 1,
      on: (ev, cb) => cb(),
      send: sinon.spy(() => {})
    };
  });

  afterEach(async () => {
    return new Promise(resolve => {
      embark.teardown();
      sinon.restore();
      proxy.stop(resolve);
    });
  });

  describe('instantiation', () => {

    it('should register proxy:websocket:subscribe command handler', () => {
      embark.events.assert.commandHandlerRegistered('proxy:websocket:subscribe');
    });

    it('should register proxy:websocket:unsubscribe command handler', () => {
      embark.events.assert.commandHandlerRegistered('proxy:websocket:unsubscribe');
    });
  });

  it('should get notified when the connecting node is ready', async () => {

    const providerSendSpy = sinon.spy(() => Promise.resolve());

    embark.events.setCommandHandler('blockchain:node:provider', (cb) => {
      cb(null, {
        send: providerSendSpy
      });
    });

    await proxy.nodeReady();
    assert(providerSendSpy.calledOnce);
  });

  it('should emit actions for proxy requests', async () => {

    const mockRequest = {
      method: 'POST',
      body: {
        id: 4,
        jsonrpc: '2.0',
        method: 'test_method'
      }
    };

    const requestAction = sinon.spy((params, cb) => {
      params.somethingCustom = true;
      cb(null, params);
    });

    embark.plugins.registerActionForEvent('blockchain:proxy:request', requestAction);

    const modifiedRequest = await proxy.emitActionsForRequest(mockRequest, mockWs);
    assert(modifiedRequest.isWs);
    assert(modifiedRequest.transport);
    assert(modifiedRequest.somethingCustom);
    assert.equal(modifiedRequest.request, mockRequest);
  });

  it('should emit actions for proxy responses', async () => {

    const mockRequest = {
      method: 'POST',
      body: {
        id: 4,
        jsonrpc: '2.0',
        method: 'test_method'
      }
    };

    const mockResponse = {
      "id": 4,
      "jsonrpc": "2.0",
      "result": {
        "response": "ok"
      }
    };

    const responseAction = sinon.spy((params, cb) => {
      params.somethingCustom = true;
      cb(null, params);
    });

    embark.plugins.registerActionForEvent('blockchain:proxy:response', responseAction);

    const modifiedResponse = await proxy.emitActionsForResponse(mockRequest, mockResponse, mockWs);
    assert(modifiedResponse.isWs);
    assert(modifiedResponse.transport);
    assert.equal(modifiedResponse.transport, mockWs);
    assert(modifiedResponse.somethingCustom);
  });

  it('should process request and run request and reponse actions', async () => {

    const mockRequest = {
      method: 'POST',
      body: {
        id: 2,
        jsonrpc: '2.0',
        method: 'test_method'
      }
    };

    const mockRPCResponse = {
      "id": 2,
      "jsonrpc": "2.0",
      "result": {
        "response": "ok"
      }
    };

    const mockRequestManager = { send: sinon.spy((options, cb) => cb(null, mockRPCResponse)) };

    embark.events.setCommandHandler('blockchain:node:provider', (cb) => cb(null, mockRequestManager));

    const requestAction = sinon.spy((params, cb) => {
      params.sendToNode = false;
      cb(null, params);
    });
    const responseAction = sinon.spy((params, cb) => cb(null, params));

    embark.plugins.registerActionForEvent('blockchain:proxy:request', requestAction);
    embark.plugins.registerActionForEvent('blockchain:proxy:response', responseAction);
    await proxy.processRequest(mockRequest, mockWs);
    assert(requestAction.calledOnce);
    assert(responseAction.calledOnce);
    assert(mockWs.send.calledOnce);
  });

  it('should forward request to node', async () => {

    const mockRequest = {
      method: 'POST',
      body: {
        id: 3,
        jsonrpc: '2.0',
        method: 'test_method'
      }
    };

    const mockRPCResponse = {
      "id": 3,
      "jsonrpc": "2.0",
      "result": {
        "response": "ok"
      }
    };

    const forwardSpy = sinon.spy((options, cb) => cb(null, mockRPCResponse));
    const mockRequestManager = { send: forwardSpy };

    embark.events.setCommandHandler('blockchain:node:provider', (cb) => cb(null, mockRequestManager));

    const requestAction = sinon.spy((params, cb) => {
      params.sendToNode = true;
      cb(null, params);
    });

    embark.plugins.registerActionForEvent('blockchain:proxy:request', requestAction);
    await proxy.processRequest(mockRequest, mockWs);
    assert(forwardSpy.calledOnce);
  });

  it('should stop the proxy server', () => {

    const closeSpy = sinon.spy(cb => cb());
    proxy.server = {
      close: closeSpy
    };

    proxy.stop(() => {
      assert(true);
    });

    assert(closeSpy.calledOnce);
    assert.equal(proxy.server, null);
  });
});
