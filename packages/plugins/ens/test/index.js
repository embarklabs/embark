const ENS = require("../dist/index");
const { fakeEmbark } = require('embark-testing');

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
        }
      }
    };
  });

  afterEach(() => {
    embark.teardown();
  });

  it("should register the right artifact", (done) => {
    const pipelineRegisterHandler = jest.fn((args, cb) => {
      expect(args).toEqual({
        path: ['test-dir', 'config'],
        file: 'namesystem.json',
        format: 'json',
        content: Object.assign({}, embark.config.namesystemConfig, ens.getEnsConfig())
      });
      cb();
      done();
    });
    ens.getEnsConfig = jest.fn();

    embark.events.setCommandHandler('pipeline:register', pipelineRegisterHandler);

    ens.addArtifactFile({}, () => {});
  });

  describe('safeRegisterSubDomain', () => {
    it('should register if the name is not registered', (done) => {
      ens.ensResolve = jest.fn((name, cb) => {cb(null, null)});
      ens.registerSubDomain = jest.fn((defaultAccount, subDomainName, reverseNode, address, secureSend, callback) => callback());

      ens.safeRegisterSubDomain('test.eth', '0x0123', '0x4321', () => {
        expect(ens.registerSubDomain).toHaveBeenCalled();
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
