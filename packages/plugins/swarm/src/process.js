import {ProcessWrapper} from 'embark-core';
import {dappPath} from 'embark-utils';
const child_process = require('child_process');
const constants = require('embark-core/constants');

let swarmProcess;

class SwarmProcess extends ProcessWrapper {
  constructor(options) {
    super();
    this.storageConfig = options.storageConfig;
    this.blockchainConfig = options.blockchainConfig;
    this.cors = options.cors;
    this.command = this.storageConfig.swarmPath || 'swarm';
    this.defaultAccount = options.defaultAccount;
  }

  startSwarmDaemon() {
    const self = this;
    let bzzaccount;
    let password;
    // TODO(ericmastro): This needs to be updated to use the first unlocked node account based on the configuration. If node accounts are disabled in the config, use storageConfig.account.address/password and show an error if they are not configured.
    // use our storage config address/password if we have it
    if (this.storageConfig.account && this.storageConfig.account.address && this.storageConfig.account.password) {
      bzzaccount = this.storageConfig.account.address;
      password = dappPath(this.storageConfig.account.password);
    }
    // default to our blockchain config account, or our default account
    else if (this.blockchainConfig.account &&
      (this.blockchainConfig.account.address || this.defaultAccount) &&
      this.blockchainConfig.account.password
    ) {
      // defaultAccount is populated from blockchain_connector.determineDefaultAccount which is either
      // config/blockchain.js > account > address or the first address returned from web3.eth.getAccounts
      // (usually the default account)
      bzzaccount = this.blockchainConfig.account.address || this.defaultAccount;
      password = dappPath(this.blockchainConfig.account.password);
      console.trace(`Swarm account/password falling back to the blockchain account ${this.blockchainConfig.account.address || this.defaultAccount}. The account is either specified in config/blockchain.js > account > address or is the first address returned from web3.eth.getAccounts. The password is specified in config/blockchain.js > account > address.`);
    }
    else {
      return 'Account address and password are needed in the storage config to start the Swarm process';
    }

    const datadir = this.blockchainConfig.datadir || dappPath(`.embark/development/datadir`);
    const args = [
      '--datadir', datadir,
      '--bzzaccount', bzzaccount,
      '--corsdomain', self.cors.join(',')
    ];
    if (password) args.push('--password', password);

    console.trace('Starting swarm process with arguments: ' + args.join(' '));
    this.child = child_process.spawn(this.command, args);

    this.child.on('error', (err) => {
      err = err.toString();
      console.error('Swarm error: ', err);
    });
    this.child.stdout.on('data', (data) => {
      data = data.toString();
      console.log(`Swarm error: ${data}`);
    });
    // Swarm logs appear in stderr somehow
    this.child.stderr.on('data', (data) => {
      data = data.toString();
      if (!self.readyCalled && (data.includes('Swarm http proxy started') || data.includes('Swarm network started'))) {
        self.readyCalled = true;
        self.send({result: constants.storage.initiated});
      }
      console.log('Swarm: ' + data);
    });
    this.child.on('exit', (code) => {
      let message = 'Swarm process exited';
      if (code) {
        message += " with error code " + code;
      }
      swarmProcess.send({result: constants.storage.exit, error: message});
    });
  }

  kill() {
    if (this.child) {
      this.child.kill();
      swarmProcess.send({result: constants.storage.exit});
    }
  }
}

process.on('message', (msg) => {
  if (msg === 'exit') {
    return swarmProcess.kill();
  }
  if (msg.action === constants.storage.init) {
    swarmProcess = new SwarmProcess(msg.options);
    const error = swarmProcess.startSwarmDaemon();

    if (error) {
      swarmProcess.send({result: constants.storage.initiated, error});
    }
  }
});
