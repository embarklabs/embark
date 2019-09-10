const Embark = require('./embark');
const Events = require('./events');
const Plugin = require('./plugin');

const fakeEmbark = () => {
  const events = new Events();
  const plugin = new Plugin();

  const embark = new Embark(events, plugin);
  return embark;
};

module.exports = {
  Embark,
  Events,
  Plugin,

  fakeEmbark
};
