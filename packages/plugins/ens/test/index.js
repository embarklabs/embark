const ENS = require("../src/index");

describe('embark-ens', () => {
  let ens, doneCb;

  const { embark } = fakeEmbark();


  beforeEach(() => {
    ens = new ENS(embark);
  });

  afterEach(() => {
    embark.teardown();
  });

  it("should register the right artifact", (done) => {

    const pipelineRegisterHandler = jest.fn();

    embark.events.setCommandHandler('pipeline:register', pipelineRegisterHandler);

    ens.addArtifactFile({}, () => {
      expect(pipelineRegisterHandler).toHaveBeenNthCalledWith({
        path: [embark.config.embarkConfig.generationDir, 'config'],
        file: 'namesystem.json',
        format: 'json',
        content: Object.assign({}, embark.config.namesystemConfig, ens.getEnsConfig())
      });
      done();
    });
  });
});
