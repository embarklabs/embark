class Ganache {
  constructor(embark) {
    embark.events.request('blockchain:vm:register', () => {
      const ganache = require('ganache-cli');
      return ganache.provider();
    });
  }
}

module.exports = Ganache;
