class Ganache {
  constructor(embark) {
    embark.events.request('blockchain:vm:register', () => {
      const ganache = require('ganache-cli');
      // Default to 8000000, which is the server default
      // Somehow, the provider default is 6721975
      return ganache.provider({gasLimit: '0x7A1200'});
    });
  }
}

module.exports = Ganache;
