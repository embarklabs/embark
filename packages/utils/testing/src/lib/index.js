const Embark = require('./embark');
const Events = require('./events');
const Plugins = require('./plugin');
const HttpMockServer = require('./httpServer');

const fakeEmbark = (config) => {
  const events = new Events();
  const plugins = new Plugins();

  const ipc = {
    isServer: () => { return true; },
    broadcast: () => {},
    on: () => {},
    isClient: () => { return false; }
  };

  config = config || {};
  config.ipc = config.ipc || ipc;

  const embark = new Embark(events, plugins, config);
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

  fakeEmbark
};
