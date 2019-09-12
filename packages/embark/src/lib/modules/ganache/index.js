class Ganache {
  constructor(embark) {
    embark.events.request('proxy:vm:register', () => {
      const ganache = require('ganache-cli');
      return ganache.provider();
    });
  }
}

module.exports = Ganache;
