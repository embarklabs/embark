const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const ethereumjsWallet = require('ethereumjs-wallet');
const fs = require('../core/fs');
const {getHexBalanceFromString} = require('../utils/utils');

const path = require('path');

class AccountParser {
  static parseAccountsConfig(accountsConfig, web3, logger, nodeAccounts) {
    let accounts = [];
    if (accountsConfig && accountsConfig.length) {
      accountsConfig.forEach(accountConfig => {
        let account = AccountParser.getAccount(accountConfig, web3, logger, nodeAccounts);
        if (!account) {
          return;
        }
        if (Array.isArray(account)) {
          accounts = accounts.concat(account);
          return;
        }
        accounts.push(account);
      });
    }
    return accounts;
  }

  /*eslint complexity: ["error", 30]*/
  static getAccount(accountConfig, web3, logger = console, nodeAccounts) {
    const {utils} = require('web3');
    const returnAddress = web3 === false;
    let hexBalance = null;
    if (accountConfig.balance && web3) {
      hexBalance = getHexBalanceFromString(accountConfig.balance, web3);
    }

    if (accountConfig.privateKey === 'random') {
      if (!web3) {
        logger.warn('Cannot use random in this context');
        return null;
      }
      let randomAccount = web3.eth.accounts.create();
      accountConfig.privateKey = randomAccount.privateKey;
    }

    if (accountConfig.nodeAccounts) {
      if (!nodeAccounts && !returnAddress) {
        logger.warn('Cannot use nodeAccounts in this context');
        return null;
      }
      if (!nodeAccounts || !nodeAccounts.length) {
        return null;
      }

      return nodeAccounts.map(account => {
        return (typeof account === 'string') ? { address: account } : account;
      });
    }

    if (accountConfig.privateKey) {
      if (!accountConfig.privateKey.startsWith('0x')) {
        accountConfig.privateKey = '0x' + accountConfig.privateKey;
      }
      if (!utils.isHexStrict(accountConfig.privateKey)) {
        logger.warn(`Private key ending with ${accountConfig.privateKey.substr(accountConfig.privateKey.length - 5)} is not a HEX string`);
        return null;
      }
      if (returnAddress) {
        return ethereumjsWallet.fromPrivateKey(accountConfig.privateKey).getChecksumAddressString();
      }
      return Object.assign(web3.eth.accounts.privateKeyToAccount(accountConfig.privateKey), {hexBalance});
    }

    if (accountConfig.privateKeyFile) {
      let privateKeyFile = path.resolve(fs.dappPath(), accountConfig.privateKeyFile);
      let fileContent = fs.readFileSync(privateKeyFile).toString();
      if (accountConfig.password) {
        try {
          fileContent = JSON.parse(fileContent);
          if (!ethereumjsWallet['fromV' + fileContent.version]) {
            logger.error(`Key file ${accountConfig.privateKeyFile} is not a valid keystore file`);
            return null;
          }
          const wallet = ethereumjsWallet['fromV' + fileContent.version](fileContent, accountConfig.password);

          if (returnAddress) {
            return wallet.getChecksumAddressString();
          }
          return Object.assign(web3.eth.accounts.privateKeyToAccount('0x' + wallet.getPrivateKey().toString('hex')), {hexBalance});
        } catch (e) {
          logger.error('Private key file is not a keystore JSON file but a password was provided');
          logger.error(e.message || e);
          return null;
        }
      }

      fileContent = fileContent.trim().split(/[,;]/);
      return fileContent.map((key, index) => {
        if (!key.startsWith('0x')) {
          key = '0x' + key;
        }
        if (!utils.isHexStrict(key)) {
          logger.warn(`Private key is not a HEX string in file ${accountConfig.privateKeyFile} at index ${index}`);
          return null;
        }
        if (returnAddress) {
          return ethereumjsWallet.fromPrivateKey(key).getChecksumAddressString();
        }
        return Object.assign(web3.eth.accounts.privateKeyToAccount(key), {hexBalance});
      });
    }

    if (accountConfig.mnemonic) {
      const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(accountConfig.mnemonic.trim()));

      const addressIndex = accountConfig.addressIndex || 0;
      const numAddresses = accountConfig.numAddresses || 1;
      const wallet_hdpath = accountConfig.hdpath || "m/44'/60'/0'/0/";

      const accounts = [];
      for (let i = addressIndex; i < addressIndex + numAddresses; i++) {
        const wallet = hdwallet.derivePath(wallet_hdpath + i).getWallet();
        if (returnAddress) {
          accounts.push(wallet.getAddressString());
        } else {
          accounts.push(Object.assign(web3.eth.accounts.privateKeyToAccount('0x' + wallet.getPrivateKey().toString('hex')), {hexBalance}));
        }
      }
      return accounts;
    }
    if (accountConfig.secretKey) {
      // Ignore simulator configs
      return null;
    }
    logger.warn(__('Unsupported account configuration: %s' ,JSON.stringify(accountConfig)));
    logger.warn(__('Check the docs at %s', 'https://embark.status.im/docs/contracts_deployment.html#Using-accounts-in-a-wallet'.underline));
    return null;
  }
}

module.exports = AccountParser;
