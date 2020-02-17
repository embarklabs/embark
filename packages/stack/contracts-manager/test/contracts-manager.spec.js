import ContractsManager from '../src';
import Contract from '../src/contract';

import sinon from 'sinon';
import assert from 'assert';
import { fakeEmbark } from 'embark-testing';

const { embark, plugins } = fakeEmbark();

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
process.env.DAPP_PATH = 'something';

describe('stack/contracts-manager', () => {

  let contractsManager;

  beforeEach(() => {
    contractsManager = new ContractsManager(embark, { plugins });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('instantiation', () => {

    it('should register contracts:reset command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:reset');
    });


    it('should register contracts:build command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:build');
    });

    it('should register contracts:list command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:list');
    });

    it('should register contracts:contract command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:contract');
    });

    it('should register contracts:add command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:add');
    });

    it('should register contracts:all command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:all');
    });

    it('should register contracts:dependencies command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:dependencies');
    });

    it('should register contracts:contract:byTxHash command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:contract:byTxHash');
    });

    it('should register contracts:reset:dependencies command handler', () => {
      contractsManager.events.assert.commandHandlerRegistered('contracts:reset:dependencies');
    });
  });

  it('should add contract objects', async () => {
    const testContract = {
      className: 'TestContract'
    };

    await embark.events.request2('contracts:add', testContract);
    const contract = await embark.events.request2('contracts:contract', testContract.className);
    assert.equal(contract.className, testContract.className);
  });

  it('should return list of added contract objects', async () => {
    const testContract = {
      className: 'TestContract'
    };

    await embark.events.request2('contracts:add', testContract);
    const list = await embark.events.request2('contracts:list');
    assert.equal(list.length, 1);
    assert.equal(list[0].className, testContract.className);
  });

  it('should build contracts', async (done) => {

    const contractsConfig = {
      contracts: {
        deploy: {
          TestContract: {}
        }
      }
    };

    const compiledContracts = {
      TestContract: {
        // `compiledContract` can't be an empty object otherwise
        // contracts-manager will exclude it from processing, resulting
        // in `TestContract` not being managed.
        code: 'some code',
      }
    };

    const beforeBuildAction = sinon.spy((params, cb) => cb(null, params));
    embark.registerActionForEvent('contracts:build:before', beforeBuildAction);

    contractsManager.buildContracts(contractsConfig, compiledContracts, (err, result) => {
      assert(beforeBuildAction.calledOnce);
      assert.ok(result.TestContract instanceof Contract);
      done();
    });
  });

  it('should return contracts dependencies', async () => {
    const contractsConfig = {
      contracts: {
        deploy: {
          TestContract: {
            deps: ['Dep1', 'Dep2']
          },
          Dep1: {},
          Dep2: {}
        }
      }
    };

    const compiledContracts = {
      TestContract: {
        code: 'foo'
      },
      Dep1: {},
      Dep2: {}
    };

    const beforeBuildAction = sinon.spy((params, cb) => { cb(null, params); });
    embark.registerActionForEvent('contracts:build:before', beforeBuildAction);

    await embark.events.request2('contracts:build', contractsConfig, compiledContracts);
    const dependencies = await embark.events.request2('contracts:dependencies');

    assert(dependencies['TestContract']);
    assert.equal(dependencies['TestContract'].length, 2);
  });

  describe('API calls', () => {

    describe('GET /embark-api/contract/:contractName', () => {

      const method = 'GET';
      const endpoint = '/embark-api/contract/:contractName';

      it(`should register ${method} ${endpoint}`, () => {
        contractsManager.plugins.assert.apiCallRegistered(method, endpoint);
      })

      it('should return contract by name', async () => {
        const TestContract = new Contract(embark.logger, {});
        contractsManager.getContract = sinon.fake.returns(TestContract);

        const response = await contractsManager.plugins.mock.apiCall(method, endpoint, {
          params: {
            className: 'TestContract'
          }
        });
        assert(response.send.calledWith(TestContract));
      });
    });

    describe('GET /embark-api/contracts', () => {

      const method = 'GET';
      const endpoint = '/embark-api/contracts';

      it(`should register ${method} ${endpoint}`, () => {
        contractsManager.plugins.assert.apiCallRegistered(method, endpoint);
      })

      it('should return list of formatted contracts', async () => {
        const testContracts = [
          { className: 'TestContract' },
          { className: 'TestContract2' }
        ];

        contractsManager.formatContracts = sinon.fake.returns(testContracts);
        contractsManager.getContract = sinon.spy(name => {
          return testContracts.find(contract => contract.className = name);
        });

        const response = await contractsManager.plugins.mock.apiCall(method, endpoint);
        assert(response.send.calledWith(testContracts));
      })
    });

    describe('POST /embark-api/contract/:contractName/deploy', () => {

      const method = 'POST';
      const endpoint = '/embark-api/contract/:contractName/deploy';

      it(`should register ${method} ${endpoint}`, () => {
        contractsManager.plugins.assert.apiCallRegistered(method, endpoint);
      })

      it('should deploy contract by name', async () => {
        const TestContract = new Contract(embark.logger, { code: 'some code'});

        function MockContract() {
          return {
            deploy: (args) => {
              return {
                estimateGas: () => Promise.resolve(100000),
                send: () => Promise.resolve({ _address: 'new address' })
              }
            }
          }
        }

        const Web3Mock = {
          eth: {
            getAccounts: () => Promise.resolve(['0xfirst']),
            Contract: MockContract
          }
        };

        contractsManager.getContract = sinon.fake.returns(TestContract);
        contractsManager.web3 = Promise.resolve(Web3Mock);

        const response = await contractsManager.plugins.mock.apiCall(method, endpoint, {
          contractName: 'TestContract',
          inputs: []
        });

        assert(response.send.calledWith({ result: 'new address' }));
      })
    });
  });
});
