class Ganache {
  constructor(embark) {
    embark.events.request('blockchain:vm:register', 'ganache-cli', () => {
      const ganache = require('ganache-cli');
      const blockchainConfig = embark.config.blockchainConfig;

      // Ensure the dir exists before initiating Ganache, because Ganache has a bug
      // => https://github.com/trufflesuite/ganache-cli/issues/558
      embark.fs.ensureDirSync(blockchainConfig.datadir);

      const hasAccounts = blockchainConfig.accounts && blockchainConfig.accounts.length;

      return ganache.provider({
        // Default to 8000000, which is the server default
        // Somehow, the provider default is 6721975
        gasLimit: blockchainConfig.targetGasLimit || '0x7A1200',
        blockTime: blockchainConfig.simulatorBlocktime,
        network_id:  blockchainConfig.networkId || 1337,
        db_path: blockchainConfig.datadir,
        default_balance_ether: hasAccounts ? null : '99999',
        mnemonic: hasAccounts ? null : 'example exile argue silk regular smile grass bomb merge arm assist farm'
      });
    });
  }
}

module.exports = Ganache;
