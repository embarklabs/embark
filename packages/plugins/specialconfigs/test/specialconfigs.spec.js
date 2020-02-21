import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';
import SpecialConfigs from '../src';
import Utils from '../src/utils';

describe('plugins/specialconfigs', () => {

  let specialConfigs, embark, beforeDeployAction, afterDeployAction;

  beforeEach(() => {
    beforeDeployAction = sinon.spy((params, cb) => cb(params));
    afterDeployAction = sinon.spy((params, cb) => cb(params));

    const testBed = fakeEmbark({
      contractsConfig: {
        beforeDeploy: beforeDeployAction,
        afterDeploy: afterDeployAction
      }
    });

    embark = testBed.embark;
    specialConfigs = new SpecialConfigs(testBed.embark, { buildDir: 'foo' });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('instantiation', () => {

    it('should register deployment:contract:address command handler', () => {
      specialConfigs.events.assert.commandHandlerRegistered('deployment:contract:address');
    });

    it('should register action for event deployment:deployContracts:beforeAll', () => {
      specialConfigs.embark.plugins.assert.actionForEventRegistered('deployment:deployContracts:beforeAll');
    });

    it('should register action for event deployment:deployContracts:aftereAll', () => {
      specialConfigs.embark.plugins.assert.actionForEventRegistered('deployment:deployContracts:afterAll');
    });

    it('should register action for event deployment:contract:deployed', () => {
      specialConfigs.embark.plugins.assert.actionForEventRegistered('deployment:contract:deployed');
    });

    it('should register action for event deployment:contract:shouldDeploy', () => {
      specialConfigs.embark.plugins.assert.actionForEventRegistered('deployment:contract:shouldDeploy');
    });

    it('should register action for event deployment:contract:beforeDeploy', () => {
      specialConfigs.embark.plugins.assert.actionForEventRegistered('deployment:contract:beforeDeploy');
    });
  });

  describe('function APIs', () => {
    it('should run registered beforeDeploy action', done => {
      embark.plugins.runActionsForEvent('deployment:deployContracts:beforeAll', {}, () => {
        assert(beforeDeployAction.calledOnce);
        done();
      });
    });

    it('should run registered afterDeploy action', done => {
      const contractsListCommandHandler = sinon.spy(cb => cb(null, []));
      embark.events.setCommandHandler('contracts:list', contractsListCommandHandler);

      embark.plugins.runActionsForEvent('deployment:deployContracts:afterAll', {}, () => {
        assert(afterDeployAction.calledOnce);
        done();
      });
    });

    it('should run registered onDeploy actions', done => {
      const contractsListCommandHandler = sinon.spy(cb => cb(null, []));
      const onDeployAction = sinon.spy(deps => {});

      const testParams = {
        contract: {
          className: 'TestContract',
          onDeploy: onDeployAction
        }
      };

      embark.events.setCommandHandler('contracts:list', contractsListCommandHandler);
      embark.plugins.runActionsForEvent('deployment:contract:deployed', testParams, () => {
        assert(onDeployAction.calledOnce);
        done();
      });
    });

    it('should run registered deployIf action', done => {
      const contractsListCommandHandler = sinon.spy(cb => cb(null, []));
      const deployIfAction = sinon.spy(deps => Promise.resolve(true))

      const testParams = {
        contract: {
          className: 'TestContract',
          deployIf: deployIfAction
        }
      };

      embark.events.setCommandHandler('contracts:list', contractsListCommandHandler);
      embark.plugins.runActionsForEvent('deployment:contract:shouldDeploy', testParams, (err, params) => {
        assert(deployIfAction.calledOnce);
        assert(params.shouldDeploy);
        done();
      });
    });

    it('should run registered beforeDeploy action for contract', done => {
      const contractsListCommandHandler = sinon.spy(cb => cb(null, []));
      const beforeDeployAction = sinon.spy((params, cb) => cb(null, true));

      const testParams = {
        contract: {
          className: 'TestContract',
          beforeDeploy: beforeDeployAction
        }
      };

      embark.events.setCommandHandler('contracts:list', contractsListCommandHandler);
      embark.plugins.runActionsForEvent('deployment:contract:beforeDeploy', testParams, () => {
        assert(beforeDeployAction.calledOnce);
        done();
      });
    });
  });

  describe('listAPIs', () => {

    beforeEach(() => {
      const testBed = fakeEmbark({
        contractsConfig: {
          afterDeploy: ['console.log("afterDeploy");']
        }
      });

      embark = testBed.embark;
      specialConfigs = new SpecialConfigs(testBed.embark, { buildDir: 'foo' });
    });

    afterEach(() => {
      embark.teardown();
      sinon.restore();
    });

    it('should run registered afterDeploy action', done => {
      const runcodeEvalCommandHandler = sinon.spy((cmd, callback) => callback());

      embark.events.setCommandHandler('runcode:eval', runcodeEvalCommandHandler);
      embark.plugins.runActionsForEvent('deployment:deployContracts:afterAll', {}, () => {
        assert(runcodeEvalCommandHandler.calledOnce);
        assert(runcodeEvalCommandHandler.calledWith('console.log("afterDeploy");'));
        done();
      });
    });

    it('should run registered onDeploy actions', done => {
      const runcodeEvalCommandHandler = sinon.spy((cmd, callback) => callback());

      const testParams = {
        contract: {
          className: 'TestContract',
          onDeploy: ['console.log("onDeploy action");']
        }
      };

      embark.events.setCommandHandler('runcode:eval', runcodeEvalCommandHandler);
      embark.plugins.runActionsForEvent('deployment:contract:deployed', testParams, () => {
        assert(runcodeEvalCommandHandler.calledOnce);
        assert(runcodeEvalCommandHandler.calledWith('console.log("onDeploy action");'));
        done();
      });
    });

    it('should run registered deployIf action', done => {
      const runcodeEvalCommandHandler = sinon.spy((cmd, callback) => callback());

      const testParams = {
        contract: {
          className: 'TestContract',
          deployIf: 'true'
        }
      };

      embark.events.setCommandHandler('runcode:eval', runcodeEvalCommandHandler);
      embark.plugins.runActionsForEvent('deployment:contract:shouldDeploy', testParams, () => {
        assert(runcodeEvalCommandHandler.calledOnce);
        assert(runcodeEvalCommandHandler.calledWith('true'));
        done();
      });
    });
  });
});
