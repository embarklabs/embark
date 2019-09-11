import sinon from 'sinon';
import assert from 'assert';
import Deployment from '../src/';

const events = {
  listeners: {},
  setCommandHandler: sinon.spy((cmd, fn) => {
    events.listeners[cmd] = fn;
  }),
  request: sinon.spy((cmd, ...args) => {
    assert(events.listeners[cmd]);
    events.listeners[cmd](...args);
  }),
  emit: (name) => {}
};

const plugins = {
  listeners: {},
  _plugin: {
    listeners: {},
    registerActionForEvent: (name, cb) => {
      if (!plugins._plugin.listeners[name]) {
        plugins._plugin.listeners[name] = [];
      }
      plugins._plugin.listeners[name].push(cb);
    }
  },
  createPlugin: (name, opts) => {
    return _plugin;
  },
  emitAndRunActionsForEvent: sinon.spy((name, options, cb) => {
    if (plugins._plugin.listeners[name]) {
      plugins._plugin.listeners[name].forEach(fn => {
        fn(options, cb);
      });
    }
  })
};

const fakeEmbark = {
  events,
  logger: {
    info: () => {}
  },
  config: {
    blockchainConfig: {}
  },
  assert: {
    hasCommandHandler: (cmd) => {
      sinon.assert.calledWith(fakeEmbark.events.setCommandHandler, cmd);
    },
    hasRequested: (cmd) => {
      sinon.assert.calledWith(fakeEmbark.events.request, cmd);
    },
    hasRequestedWith: (cmd, ...args) => {
      sinon.assert.calledWith(fakeEmbark.events.request, cmd, ...args);
    },
  },
  teardown: () => {
    fakeEmbark.events.listeners = {};
    plugins._plugin.listeners = {};
  }
};

describe('stack/deployment', () => {

  let deployment;
  let deployedContracts = [];

  let beforeAllAction, beforeDeployAction, shouldDeployAction, deployedAction, afterAllAction;
  let deployFn;
  let doneCb;

  beforeEach(() => {
    deployment = new Deployment(fakeEmbark, { plugins });

    beforeAllAction = sinon.spy((params, cb) => { cb(null, params); });
    beforeDeployAction = sinon.spy((params, cb) => { cb(null, params); });
    shouldDeployAction = sinon.spy((params, cb) => { cb(null, params); });
    deployedAction = sinon.spy((params, cb) => { cb(null, params); });
    afterAllAction = sinon.spy((params, cb) => { cb(null, params); });

    deployFn = sinon.spy((contract, done) => {
      deployedContracts.push(contract);
      done(null, {}); // deployer needs to finish with a receipt object
    });

    doneCb = sinon.fake();
  });

  afterEach(() => {
    deployedContracts = [];
    fakeEmbark.teardown();
    sinon.restore();
  });

  test('it should register deployFn and deploy contract by using it', () => {

    let testContract = { className: 'TestContract', shouldDeploy: true };

    plugins._plugin.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:deployed', deployedAction);

    events.request('deployment:deployer:register', 'ethereum', deployFn);
    events.request('deployment:contract:deploy', testContract, doneCb);

    assert(beforeDeployAction.calledOnce)
    assert(shouldDeployAction.calledOnce)
    assert(deployFn.calledWith(testContract));
    assert.equal(deployedContracts[0], testContract);
    assert(doneCb.calledOnce);
  });

  test('it should deploy list of contracts', () => {

    let testContracts = [
      { className: 'Contract1', shouldDeploy: true },
      { className: 'Contract2', shouldDeploy: true },
      { className: 'Contract3', shouldDeploy: true }
    ];

    plugins._plugin.registerActionForEvent('deployment:deployContracts:beforeAll', beforeAllAction);
    plugins._plugin.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:deployed', deployedAction);
    plugins._plugin.registerActionForEvent('deployment:deployContracts:afterAll', afterAllAction);

    events.request('deployment:deployer:register', 'ethereum', deployFn);
    events.request('deployment:contracts:deploy', testContracts, {}, doneCb);

    assert(beforeAllAction.calledOnce);

    fakeEmbark.assert.hasRequestedWith('deployment:contract:deploy', testContracts[0]);
    fakeEmbark.assert.hasRequestedWith('deployment:contract:deploy', testContracts[1]);
    fakeEmbark.assert.hasRequestedWith('deployment:contract:deploy', testContracts[2]);

    assert(deployFn.calledWith(testContracts[0]));
    assert(deployFn.calledWith(testContracts[1]));
    assert(deployFn.calledWith(testContracts[2]));

    assert.equal(deployedAction.callCount, 3);
    assert.equal(deployedContracts.length, 3);
    assert(afterAllAction.calledOnce);
    assert(doneCb.calledOnce);
  });

  test('it should deploy contracts in correct order', () => {
    let testContracts = [
      { className: 'A', shouldDeploy: true },
      { className: 'B', shouldDeploy: true },
      { className: 'C', shouldDeploy: true },
      { className: 'D', shouldDeploy: true },
      { className: 'E', shouldDeploy: true },
      { className: 'F', shouldDeploy: true }
    ];

    let testContractDependencies = {
      A: ['B'],
      B: [],
      C: ['A'],
      D: ['F'],
      E: ['A'],
      F: []
    };

    plugins._plugin.registerActionForEvent('deployment:deployContracts:beforeAll', beforeAllAction);
    plugins._plugin.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    plugins._plugin.registerActionForEvent('deployment:contract:deployed', deployedAction);
    plugins._plugin.registerActionForEvent('deployment:deployContracts:afterAll', afterAllAction);

    events.request('deployment:deployer:register', 'ethereum', deployFn);
    events.request('deployment:contracts:deploy', testContracts, testContractDependencies, doneCb);

    assert.equal(deployedContracts.length, 6);

    // expected result: [B, F, A, D, C, E]
    assert.equal(deployedContracts[0].className, testContracts[1].className);
    assert.equal(deployedContracts[1].className, testContracts[5].className);
    assert.equal(deployedContracts[2].className, testContracts[0].className);
    assert.equal(deployedContracts[3].className, testContracts[3].className);
    assert.equal(deployedContracts[4].className, testContracts[2].className);
    assert.equal(deployedContracts[5].className, testContracts[4].className);
  });
});
