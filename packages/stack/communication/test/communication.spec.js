import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import Communication from '../src/';

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["assert", "expect"] }] */

describe('stack/communication', () => {

  // eslint-disable-next-line no-unused-vars
  let communication, communicationNodeLaunchFn, doneCb;

  const { embark } = fakeEmbark();

  beforeEach(() => {
    embark.setConfig({
      communicationConfig: {
        connection: {
          host: 'localhost'
        }
      },
      embarkConfig: {}
    });

    communication = new Communication(embark);

    communicationNodeLaunchFn = sinon.spy(done => {
      embark.events.request('processes:register', 'communication', {
        launchFn: cb => cb(),
        stopFn: cb => cb()
      });

      embark.events.request('processes:launch', 'communication', _err => {
        done();
      });
    });

    doneCb = sinon.fake();
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  test('it should register and start communication node', () => {
    const communicationConfig = {
      provider: 'whisper',
      enabled: true
    };

    const processRegisterHandler = sinon.spy((_name, _fns) => {});
    const processLaunchHandler = sinon.spy((_name, fn) => fn());

    embark.events.setCommandHandler('processes:register', processRegisterHandler);
    embark.events.setCommandHandler('processes:launch', processLaunchHandler);

    embark.events.request('communication:node:register', 'whisper', communicationNodeLaunchFn);
    embark.events.request('communication:node:start', communicationConfig, doneCb);

    assert(communicationNodeLaunchFn.calledOnce);
    assert(doneCb.calledOnce);
  });

  test('it should register artifact file from configuration', () => {
    const pipelineRegisterHandler = sinon.spy((params, fn) => fn());
    embark.events.setCommandHandler('pipeline:register', pipelineRegisterHandler);
    embark.plugins.emitAndRunActionsForEvent('pipeline:generateAll:before', {}, doneCb);

    assert(pipelineRegisterHandler.calledOnce);
    assert(doneCb.calledOnce);
  });
});
