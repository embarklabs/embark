import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import Deployment from '../src/';

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["assert", "expect"] }] */

describe('stack/deployment', () => {

  const { embark, plugins } = fakeEmbark();

  // eslint-disable-next-line no-unused-vars
  let deployment;
  let deployedContracts = [];

  let beforeAllAction, beforeDeployAction, shouldDeployAction, deployedAction, afterAllAction;
  let deployFn;
  let doneCb;

  beforeEach(() => {
    embark.config.blockchainConfig = { enabled: true };
    deployment = new Deployment(embark, { plugins });

    beforeAllAction = sinon.spy((params, cb) => { cb(null, params); });
    beforeDeployAction = sinon.spy((params, cb) => { cb(null, params); });
    shouldDeployAction = sinon.spy((params, cb) => { cb(null, params); });
    deployedAction = sinon.spy((params, cb) => { cb(null, params); });
    afterAllAction = sinon.spy((params, cb) => { cb(null, params); });

    deployFn = sinon.spy((contract, addlDeployParams, done) => {
      deployedContracts.push(contract);
      done(null, {}); // deployer needs to finish with a receipt object
    });

    doneCb = sinon.fake();
  });

  afterEach(() => {
    deployedContracts = [];
    embark.teardown();
    sinon.restore();
  });

  test('it should register deployFn and deploy contract by using it', () => {

    let testContract = { className: 'TestContract', shouldDeploy: true };

    embark.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    embark.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    embark.registerActionForEvent('deployment:contract:deployed', deployedAction);

    embark.events.request('deployment:deployer:register', 'ethereum', deployFn);
    embark.events.request('deployment:contract:deploy', testContract, doneCb);

    assert(beforeDeployAction.calledOnce);
    assert(shouldDeployAction.calledOnce);
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

    embark.registerActionForEvent('deployment:deployContracts:beforeAll', beforeAllAction);
    embark.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    embark.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    embark.registerActionForEvent('deployment:contract:deployed', deployedAction);
    embark.registerActionForEvent('deployment:deployContracts:afterAll', afterAllAction);

    embark.events.request('deployment:deployer:register', 'ethereum', deployFn);
    embark.events.request('deployment:contracts:deploy', testContracts, {}, doneCb);

    assert(beforeAllAction.calledOnce);

    embark.events.assert.commandHandlerCalledWith('deployment:contract:deploy', testContracts[0]);
    embark.events.assert.commandHandlerCalledWith('deployment:contract:deploy', testContracts[1]);
    embark.events.assert.commandHandlerCalledWith('deployment:contract:deploy', testContracts[2]);

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

    embark.registerActionForEvent('deployment:deployContracts:beforeAll', beforeAllAction);
    embark.registerActionForEvent('deployment:contract:beforeDeploy', beforeDeployAction);
    embark.registerActionForEvent('deployment:contract:shouldDeploy', shouldDeployAction);
    embark.registerActionForEvent('deployment:contract:deployed', deployedAction);
    embark.registerActionForEvent('deployment:deployContracts:afterAll', afterAllAction);

    embark.events.request('deployment:deployer:register', 'ethereum', deployFn);
    embark.events.request('deployment:contracts:deploy', testContracts, testContractDependencies, doneCb);

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
