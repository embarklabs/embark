import assert from 'assert';
import sinon from 'sinon';
import { fakeEmbark, Ipc } from 'embark-testing';
import Blockchain from '../src';
import constants from "embark-core/constants.json";

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
const DAPP_PATH = 'something';
process.env.DAPP_PATH = DAPP_PATH;

describe('stack/blockchain', () => {

  const { embark } = fakeEmbark();

  let blockchain, Web3;
  const endpoint = 'endpoint';
  const clientName = 'test-client';

  beforeEach(() => {
    embark.setConfig({
      blockchainConfig: {
        enabled: true,
        client: clientName,
        isDev: true,
        endpoint
      },
      embarkConfig: {
        generationDir: 'dir'
      }
    });
    Web3 = sinon.stub();
    Web3.providers = {
      WebsocketProvider: sinon.stub()
    };
    blockchain = new Blockchain(embark, {
      plugins: embark.plugins,
      ipc: embark.ipc,
      Web3
    });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  describe('constructor', () => {
    test('it should assign the correct properties', () => {
      assert.strictEqual(blockchain.embark, embark);
      assert.strictEqual(blockchain.embarkConfig, embark.config.embarkConfig);
      assert.strictEqual(blockchain.logger, embark.logger);
      assert.strictEqual(blockchain.events, embark.events);
      assert.strictEqual(blockchain.blockchainConfig, embark.config.blockchainConfig);
      assert.strictEqual(blockchain.contractConfig, embark.config.contractConfig);
      assert.strictEqual(blockchain.startedClient, null);
      assert.strictEqual(blockchain.plugins, embark.plugins);
      assert.ok(Object.entries(blockchain.blockchainNodes).length === 0 && blockchain.blockchainNodes.constructor === Object);
    });
    test('it should register command handler for \'blockchain:node:register\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:node:register");
    });

    test('it should register command handler for \'blockchain:node:start\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:node:start");
    });

    test('it should register command handler for \'blockchain:node:stop\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:node:stop");
    });

    test('it should register command handler for \'blockchain:client:register\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:client:register");
    });

    test('it should register command handler for \'blockchain:client:provider\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:client:provider");
    });

    test('it should register command handler for \'blockchain:node:provider:template\'', () => {
      blockchain.events.assert.commandHandlerRegistered("blockchain:node:provider:template");
    });

    test('it should listen for ipc request \'blockchain:node\'', () => {
      blockchain.embark.ipc.assert.listenerRegistered('blockchain:node');
    });

    test('it should not listen for ipc request \'blockchain:node\' when ipc role is not server', () => {
      const ipc = new Ipc(false);
      blockchain = new Blockchain(embark, {
        plugins: embark.plugins,
        ipc,
        warnIfPackageNotDefinedLocally: sinon.stub(),
        Web3
      });

      ipc.assert.listenerNotRegistered('blockchain:node');
    });

    test('it should respond to ipc request \'blockchain:node\' with the endpoint', () => {
      const cb = sinon.spy();
      blockchain.embark.ipc.request('blockchain:node', null, cb);
      assert(cb.calledWith(null, endpoint));
    });

    test('it should warn if \'embark-geth\' package not defined locally and geth used in config', () => {
      embark.setConfig({
        blockchainConfig: {
          enabled: true,
          client: constants.blockchain.clients.geth,
          endpoint
        }
      });
      const warnIfPackageNotDefinedLocally = sinon.stub();
      blockchain = new Blockchain(embark, {
        plugins: embark.plugins,
        ipc: embark.ipc,
        warnIfPackageNotDefinedLocally
      });
      assert(warnIfPackageNotDefinedLocally.calledWith("embark-geth"));
    });

    test('it should warn if \'embark-parity\' package not defined locally and geth used in config', () => {
      embark.setConfig({
        blockchainConfig: {
          enabled: true,
          client: constants.blockchain.clients.parity,
          endpoint
        }
      });
      const warnIfPackageNotDefinedLocally = sinon.stub();
      blockchain = new Blockchain(embark, {
        plugins: embark.plugins,
        ipc: embark.ipc,
        warnIfPackageNotDefinedLocally
      });
      assert(warnIfPackageNotDefinedLocally.calledWith("embark-parity"));
    });
  });


  describe('methods', () => {
    describe('registerConsoleCommands', () => {
      test('it should register console command \'log blockchain on/off\'', () => {
        blockchain.plugins.assert.consoleCommandRegistered('log blockchain on');
        blockchain.plugins.assert.consoleCommandRegistered('log blockchain off');
      });

      test('it should run command for \'log blockchain on\'', async () => {
        blockchain.events.setCommandHandler('logs:ethereum:enable', sinon.fake.yields(null, '123'));
        const cb = await blockchain.plugins.mock.consoleCommand('log blockchain on');
        sinon.assert.calledWith(cb, '123');
        blockchain.events.assert.commandHandlerCalled('logs:ethereum:enable');
      });

      test('it should run command for \'log blockchain off\'', async () => {
        blockchain.events.setCommandHandler('logs:ethereum:disable', sinon.fake.yields(null, '123'));
        const cb = await blockchain.plugins.mock.consoleCommand('log blockchain off');
        sinon.assert.calledWith(cb, '123');
        blockchain.events.assert.commandHandlerCalled('logs:ethereum:disable');
      });
    });

    describe('getProviderFromTemplate', () => {
      test('it should get a HTTP provider if endpoint doesn\'t start with \'ws\'', async () => {
        blockchain.getProviderFromTemplate(endpoint);
        sinon.assert.calledWith(blockchain.Web3, endpoint);
      });
      test('it should get a WS provider if endpoint starts with \'ws\'', async () => {
        const endpoint = 'ws://';
        blockchain.getProviderFromTemplate(endpoint);
        sinon.assert.calledWith(blockchain.Web3.providers.WebsocketProvider, endpoint, {
          headers: { Origin: constants.embarkResourceOrigin }
        });
      });
    });

    describe('addArtifactFile', () => {
      test('it should return with nothing if not enabled', () => {
        blockchain.blockchainConfig.enabled = false;
        const cb = sinon.fake();
        const contractsConfigFn = sinon.fake.yields(null, {});
        blockchain.events.setCommandHandler('config:contractsConfig', contractsConfigFn);

        blockchain.addArtifactFile(null, cb);
        assert(cb.called);
        blockchain.events.assert.commandHandlerNotCalled('config:contractsConfig');
      });
      test('it should replace $EMBARK with proxy endpoint', async () => {
        const cb = sinon.fake();
        const endpoint = "endpoint2";
        const contractsConfig = {
          dappConnection: ['endpoint1', '$EMBARK', 'endpoint3'],
          dappAutoEnable: true
        };
        const contractsConfigFn = sinon.fake.yields(null, contractsConfig);
        const networkId = '1337';
        const config = {
          provider: 'web3',
          dappConnection: ['endpoint1', 'endpoint2', 'endpoint3'],
          library: 'embarkjs',
          dappAutoEnable: contractsConfig.dappAutoEnable,
          warnIfMetamask: blockchain.blockchainConfig.isDev,
          blockchainClient: blockchain.blockchainConfig.client,
          networkId
        };
        const params = {
          path: [blockchain.embarkConfig.generationDir, 'config'],
          file: 'blockchain.json',
          format: 'json',
          content: config
        };
        const pipelineRegisterFn = sinon.fake.yields(params, cb);
        const networkIdFn = sinon.fake.yields(null, networkId);
        blockchain.events.setCommandHandler('config:contractsConfig', contractsConfigFn);
        blockchain.events.setCommandHandler('blockchain:networkId', networkIdFn);
        blockchain.events.setCommandHandler('proxy:endpoint:get', sinon.fake.yields(null, endpoint));
        blockchain.events.setCommandHandler('pipeline:register', pipelineRegisterFn);

        await blockchain.addArtifactFile(null, cb);
        sinon.assert.called(pipelineRegisterFn);
        sinon.assert.calledWith(pipelineRegisterFn, params, cb);
        sinon.assert.called(cb);
      });
    });
  });

  describe('implementation', () => {

    describe('register blockchain node', () => {
      test('it should register a blockchain node', async () => {
        const blockchainFns = { isStartedFn: sinon.fake(), launchFn: sinon.fake(), stopFn: sinon.fake(), provider: sinon.fake() };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);

        blockchain.events.assert.commandHandlerCalledWith("blockchain:node:register", ...params);
        sinon.assert.match(blockchain.blockchainNodes[clientName], blockchainFns);
      });
      test('it should register a blockchain node with a default provider from template', async () => {
        const blockchainFns = { isStartedFn: sinon.fake(), launchFn: sinon.fake(), stopFn: sinon.fake() };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);
        blockchain.getProviderFromTemplate = sinon.spy((...args) => { return args[0]; });

        await blockchainFns.provider();

        sinon.assert.calledWith(blockchain.getProviderFromTemplate, endpoint);
      });
      test('it should throw an error when "isStartedFn" is not registered', async () => {
        const blockchainFns = { launchFn: sinon.fake(), stopFn: sinon.fake() };
        const params = [clientName, blockchainFns];
        await assert.rejects(
          async () => { await blockchain.events.request2("blockchain:node:register", ...params); },
          `Blockchain client '${clientName}' must be registered with an 'isStartedFn' function, client not registered.`
        );
      });
      test('it should throw an error when "launchFn" is not registered', async () => {
        const blockchainFns = { isStartedFn: sinon.fake(), stopFn: sinon.fake() };
        const params = [clientName, blockchainFns];
        await assert.rejects(
          async () => { await blockchain.events.request2("blockchain:node:register", ...params); },
          `Blockchain client '${clientName}' must be registered with an 'launchFn' function, client not registered.`
        );
      });
      test('it should throw an error when "stopFn" is not registered', async () => {
        const blockchainFns = { launchFn: sinon.fake(), isStartedFn: sinon.fake() };
        const params = [clientName, blockchainFns];
        await assert.rejects(
          async () => { await blockchain.events.request2("blockchain:node:register", ...params); },
          `Blockchain client '${clientName}' must be registered with an 'stopFn' function, client not registered.`
        );
      });
    });
    describe('start blockchain node', () => {
      test('it should call command handler with config', async () => {
        const blockchainConfig = { x: 'x', y: 'y' };
        try {
          await blockchain.events.request2("blockchain:node:start", blockchainConfig);
        } catch {
          // do nothing, just testing called with config
        }
        blockchain.events.assert.commandHandlerCalledWith("blockchain:node:start", blockchainConfig);
      });
      test('it should return when not enabled in the config', async () => {
        const blockchainConfig = { enabled: false };
        const retVal = await blockchain.events.request2("blockchain:node:start", blockchainConfig);
        assert.equal(retVal, undefined);
        blockchain.events.assert.notEmitted('blockchain:started');
      });
      test('it should return true and emit \'blockchain:started\' with client name when already started', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake.yields(null, true),
          launchFn: sinon.fake.yields(),
          stopFn: sinon.fake()
        };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);

        const blockchainConfig = { enabled: true, client: clientName };
        const alreadyStarted = await blockchain.events.request2("blockchain:node:start", blockchainConfig);
        blockchain.events.assert.emittedWith('blockchain:started', clientName);
        assert.equal(blockchain.startedClient, clientName);
        assert(alreadyStarted);
        assert(!blockchainFns.launchFn.called);
      });

      test('it should throw an error when \'isStartedFn\' throws an error', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake.yields('error'),
          launchFn: sinon.fake(),
          stopFn: sinon.fake()
        };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);

        const blockchainConfig = { enabled: true, client: clientName };
        await assert.rejects(
          async () => { await blockchain.events.request2("blockchain:node:start", blockchainConfig); }
        );
        blockchain.events.assert.notEmitted('blockchain:started');
        assert(!blockchainFns.launchFn.called);
      });

      test('it should emit \'blockchain:started\' with client name when launched (not already started)', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake.yields(null, false),
          launchFn: sinon.fake.yields(),
          stopFn: sinon.fake()
        };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);

        const blockchainConfig = { enabled: true, client: clientName };
        await blockchain.events.request2("blockchain:node:start", blockchainConfig);
        blockchain.events.assert.emittedWith('blockchain:started', clientName);
        assert.equal(blockchain.startedClient, clientName);
        assert(blockchainFns.launchFn.called);
      });

      test('it should throw when client not registered', async () => {
        const blockchainConfig = { enabled: true, client: clientName };
        await assert.rejects(
          async () => { await blockchain.events.request2("blockchain:node:start", blockchainConfig); }
        );
        blockchain.events.assert.notEmitted('blockchain:started');
      });
    });

    describe('stop blockchain node', () => {
      test('it should throw when no client started and no client name specified', async () => {
        await assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:stop");
        });
      });
      test('it should throw when no client started with specified client name', async () => {
        await assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:stop", clientName);
        });
      });

      test('it should call \'stopFn\' and emit \'blockchain:stopped\'', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake.yields(null, null)
        };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);

        await blockchain.events.request2("blockchain:node:stop", clientName);
        blockchain.events.assert.emittedWith('blockchain:stopped', clientName);
        assert.equal(blockchain.startedClient, null);
        assert(blockchainFns.stopFn.called);
      });

      test('it should call \'stopFn\' and emit \'blockchain:stopped\' when no client name provided', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake.yields(null, null)
        };
        const params = [clientName, blockchainFns];
        await blockchain.events.request2("blockchain:node:register", ...params);
        blockchain.startedClient = clientName;

        await blockchain.events.request2("blockchain:node:stop");
        blockchain.events.assert.emittedWith('blockchain:stopped', clientName);
        assert.equal(blockchain.startedClient, null);
        assert(blockchainFns.stopFn.called);
      });

    });

    describe('get blockchain node provider', () => {
      test('it should throw when no client started and no client name specified', async () => {
        await assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:provider");
        });
      });
      test('it should throw when no client started with specified client name', async () => {
        await assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:provider", clientName);
        });
      });

      test('it should call \'provider\' function and return its value', async () => {
        const provider = 'provider';
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake(),
          provider: sinon.fake.resolves(provider)
        };

        // fake a register
        blockchain.blockchainNodes[clientName] = blockchainFns;

        // fake a start
        blockchain.startedClient = clientName;

        const returnedProvider = await blockchain.events.request2("blockchain:node:provider", clientName);
        assert.equal(returnedProvider, provider);
        assert(blockchainFns.provider.called);
      });

      test('it should call \'provider\' function and return its value when no client name passed in', async () => {
        const provider = 'provider';
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake(),
          provider: sinon.fake.resolves(provider)
        };

        // fake a register
        blockchain.blockchainNodes[clientName] = blockchainFns;

        // fake a start
        blockchain.startedClient = clientName;

        const returnedProvider = await blockchain.events.request2("blockchain:node:provider");
        assert.equal(returnedProvider, provider);
        assert(blockchainFns.provider.called);
      });

      test('it should throw if the no client name provided and no client started', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake(),
          provider: sinon.fake.rejects('error')
        };

        // fake a register
        blockchain.blockchainNodes[clientName] = blockchainFns;

        assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:provider");
        });
        assert(!blockchainFns.provider.called);
      });

      test('it should throw if the \'provider\' function errors', async () => {
        const blockchainFns = {
          isStartedFn: sinon.fake(),
          launchFn: sinon.fake(),
          stopFn: sinon.fake(),
          provider: sinon.fake.rejects('error')
        };

        // fake a register
        blockchain.blockchainNodes[clientName] = blockchainFns;

        // fake a start
        blockchain.startedClient = clientName;

        assert.rejects(async () => {
          await blockchain.events.request2("blockchain:node:provider", clientName);
        });
        assert(blockchainFns.provider.called);
      });

    });

    describe('blockchain client provider', () => {
      describe('get node provider template', () => {
        test('it should get call the \'getProviderFromTemplate\' function', async () => {
          blockchain.getProviderFromTemplate = sinon.spy((...args) => { return args[0]; });
          const provider = await blockchain.events.request2('blockchain:node:provider:template');
          sinon.assert.called(blockchain.getProviderFromTemplate);
          assert.equal(provider, endpoint);
        });
      });
      describe('register blockchain provider', () => {
        test('it should register a blockchain client provider', async () => {
          const getProviderFunction = sinon.fake();
          await blockchain.events.request2('blockchain:client:register', clientName, getProviderFunction);
          assert.equal(blockchain.blockchainClients[clientName], getProviderFunction);
        });
      });
      describe('get blockchain client provider', () => {
        test('it should throw if blockchain client provider is not registered', async () => {
          await assert.rejects(async () => {
            await blockchain.events.request2('blockchain:client:provider', clientName);
          });
        });
        test('it should throw if \'proxy:endpoint:get\' throws', async () => {
          blockchain.events.setCommandHandler('proxy:endpoint:get', sinon.fake.throws());
          await assert.rejects(async () => {
            await blockchain.events.request2('blockchain:client:provider', clientName);
          });
        });
        test('it should throw if blockchain client provider throws', async () => {
          // fake blockchain client provider register
          blockchain.blockchainClients[clientName] = sinon.fake.throws();
          await assert.rejects(async () => {
            await blockchain.events.request2('blockchain:client:provider', clientName);
          });
        });
        test('it should return a blockchain client provider', async () => {
          const providerFn = (endpoint) => {
            return endpoint + 'provider';
          };
          blockchain.events.setCommandHandler('proxy:endpoint:get', sinon.fake.yields(null, endpoint));
          // fake blockchain client provider register
          blockchain.blockchainClients[clientName] = providerFn;
          const provider = await blockchain.events.request2('blockchain:client:provider', clientName);
          assert.equal(provider, 'endpointprovider');
        });
      });
    });

  });
});
