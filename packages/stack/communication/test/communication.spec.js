import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark, Plugins } from 'embark-testing';
import Communication from '../src/';

describe('stack/communication', () => {

  let communication, communicationNodeLaunchFn, doneCb;

  const { embark } = fakeEmbark();

  beforeEach(() => {
    communication = new Communication(embark);

    communicationNodeLaunchFn = sinon.spy(done => {
      embark.events.request('processes:register', 'communication', {
        launchFn: cb => cb(),
        stopFn: cb => cb(),
      });

      embark.events.request('processes:launch', 'communication', err => {
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
      provider: 'whisper'
    };

    const processRegisterHandler = sinon.spy((name, fns) => {});
    const processLaunchHandler = sinon.spy((name, fn) => fn());

    embark.events.setCommandHandler('processes:register', processRegisterHandler);
    embark.events.setCommandHandler('processes:launch', processLaunchHandler);

    embark.events.request('communication:node:register', 'whisper', communicationNodeLaunchFn);
    embark.events.request('communication:node:start', communicationConfig, doneCb);

    assert(communicationNodeLaunchFn.calledOnce);
    assert(doneCb.calledOnce);
  });
});
