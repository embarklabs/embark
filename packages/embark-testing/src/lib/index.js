const Embark = require('./embark');
const Events = require('./events');
const Plugins = require('./plugin');

const fakeEmbark = () => {
  const events = new Events();
  const plugins = new Plugins();

  const embark = new Embark(events, plugins);
  return {
    embark,
    plugins
  };
};

module.exports = {
  Embark,
  Events,
  Plugins,

  fakeEmbark
};
