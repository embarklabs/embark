const Embark = require('./embark');
const Events = require('./events');
const Plugins = require('./plugin');
const HttpMockServer = require('./httpServer');
const Ipc = require('./ipc');

const fakeEmbark = (config = {}) => {
  const events = new Events();
  const plugins = new Plugins();
  const ipc = config.ipc ?? new Ipc();

  const embark = new Embark(events, plugins, config, ipc);
  return {
    embark,
    plugins
  };
};

module.exports = {
  Embark,
  Events,
  Plugins,
  HttpMockServer,
  Ipc,
  fakeEmbark
};
