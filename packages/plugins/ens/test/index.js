const ENS = require("../dist/index");
const { fakeEmbark } = require('embark-testing');
const {Utils} = require('embarkjs');
const secureSend = Utils.secureSend;

describe('embark-ens', () => {
  let ens, doneCb;

  const { embark } = fakeEmbark();


  beforeEach(() => {
    embark.events.setCommandHandler('namesystem:node:register', () => {});
    ens = new ENS(embark);
    ens.config = {
      embarkConfig: {
        generationDir: 'test-dir'
      },
      namesystemConfig: {
        register: {
          rootDomain: 'root.eth'
        },
        dappConnection: []
      }
    };
  });

  afterEach(() => {
    embark.teardown();
  });

  it("should register the right artifact", (done) => {
    const pipelineRegisterHandler = jest.fn(async (args, cb) => {
      ens.getEnsConfig((err, config) => {
        expect(args).toEqual({
          path: ['test-dir', 'config'],
          file: 'namesystem.json',
          format: 'json',
          content: Object.assign({}, embark.config.namesystemConfig, config)
        });
        cb();
        done();
      });
    });

    embark.events.setCommandHandler('pipeline:register', pipelineRegisterHandler);

    ens.addArtifactFile({}, () => {});
  });

  describe('safeRegisterSubDomain', () => {
    it('should register if the name is not registered', (done) => {
      ens.ensResolve = jest.fn((name, cb) => {cb(null, null)});
      ens.registerSubDomain = jest.fn((defaultAccount, subDomainName, reverseNode, address, secureSend, callback) => callback());

      ens.safeRegisterSubDomain('test.eth', '0x0123', '0x4321',  () => {
        expect(ens.registerSubDomain).toHaveBeenCalledWith('0x4321', 'test.eth', '0xd523d7aaff8eefa323a17f2c79662ff1a8d952f6fa9cf53986347e99ada8098c', '0x0123', secureSend, expect.any(Function));
        done();
      });
    });

    it('should not register if the name is already registered', (done) => {
      ens.ensResolve = jest.fn((name, cb) => {cb(null, '0x0123')});
      ens.registerSubDomain = jest.fn((defaultAccount, subDomainName, reverseNode, address, secureSend, callback) => callback());

      ens.safeRegisterSubDomain('test.eth', '0x0123', '0x4321', () => {
        expect(ens.registerSubDomain).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
