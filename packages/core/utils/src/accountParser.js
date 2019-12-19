import { __ } from 'embark-i18n';
const bip39 = require("bip39");
const hdkey = require('@embarklabs/ethereumjs-wallet/hdkey');
const ethereumjsWallet = require('@embarklabs/ethereumjs-wallet');
const fs = require('fs');
import {getHexBalanceFromString, toChecksumAddress} from './web3Utils';
const {utils} = require('web3');

const path = require('path');
const ERROR_ACCOUNT = 'ERROR_ACCOUNT';

export default class AccountParser {
  static parseAccountsConfig(accountsConfig, web3, dappPath, logger, nodeAccounts) {
    let accounts = [];
    if (!(accountsConfig && accountsConfig.length)) {
      return nodeAccounts.map(account => {
        return (typeof account === 'string') ? { address: account } : account;
      });
    }
    if (accountsConfig && accountsConfig.length) {
      accountsConfig.forEach(accountConfig => {
        let account = AccountParser.getAccount(accountConfig, web3, dappPath, logger, nodeAccounts);
        if (account === ERROR_ACCOUNT) {
          throw new Error('Error getting the account');
        }
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
    // Clean up accounts duplicated
    return accounts.filter((acct, index) => {
      const sameAccountIndex = accounts.findIndex((acct2, index2) => {
        if (index === index2) {
          return false;
        }
        const addr1 = acct.address || acct;
        const addr2 = acct2.address || acct2;
        // Two different entries have the same address
        return toChecksumAddress(addr1) === toChecksumAddress(addr2);
      });
      // Only keep the account if there is no duplicate and if there is one, only keep the one an address or the first one in the list
        return (sameAccountIndex === -1 || (acct.privateKey && (!accounts[sameAccountIndex].privateKey || sameAccountIndex > index)));
    });
  }

  /*eslint complexity: ["error", 30]*/
  static getAccount(accountConfig, web3, dappPath, logger = console, nodeAccounts = null) {
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
        logger.error(`Private key ending with ${accountConfig.privateKey.substr(accountConfig.privateKey.length - 5)} is not a HEX string`);
        return ERROR_ACCOUNT;
      }

      if (returnAddress) {
        const key = Buffer.from(accountConfig.privateKey.substr(2), 'hex');
        return ethereumjsWallet.fromPrivateKey(key).getChecksumAddressString();
      }
      return Object.assign(web3.eth.accounts.privateKeyToAccount(accountConfig.privateKey), {hexBalance});
    } else if (Object.hasOwnProperty('privateKey')) {
      logger.error(__('accounts error: privateKey field is specified but its value is undefined'));
    }

    if (accountConfig.privateKeyFile) {
      let privateKeyFile = path.resolve(dappPath, accountConfig.privateKeyFile);
      let fileContent = fs.readFileSync(privateKeyFile).toString();
      if (accountConfig.password) {
        try {
          fileContent = JSON.parse(fileContent);
          if (!ethereumjsWallet['fromV' + fileContent.version]) {
            logger.error(`Key file ${accountConfig.privateKeyFile} is not a valid keystore file`);
            return ERROR_ACCOUNT;
          }
          const wallet = ethereumjsWallet['fromV' + fileContent.version](fileContent, accountConfig.password);

          if (returnAddress) {
            return wallet.getChecksumAddressString();
          }
          return Object.assign(web3.eth.accounts.privateKeyToAccount('0x' + wallet.getPrivateKey().toString('hex')), {hexBalance});
        } catch (e) {
          logger.error('Private key file is not a keystore JSON file but a password was provided');
          logger.error(e.message || e);
          return ERROR_ACCOUNT;
        }
      }

      fileContent = fileContent.trim().split(/[,;]/);
      return fileContent.map((key, index) => {
        if (!key.startsWith('0x')) {
          key = '0x' + key;
        }
        if (!utils.isHexStrict(key)) {
          logger.error(`Private key is not a HEX string in file ${accountConfig.privateKeyFile} at index ${index}`);
          return ERROR_ACCOUNT;
        }

        if (returnAddress) {
          key = Buffer.from(key.substr(2), 'hex');
          return ethereumjsWallet.fromPrivateKey(key).getChecksumAddressString();
        }
        return Object.assign(web3.eth.accounts.privateKeyToAccount(key), {hexBalance});
      });
    } else if (Object.hasOwnProperty('privateKeyFile')) {
      logger.error(__('accounts error: privateKeyFile field is specified but its value is undefined'));
    }

    if (accountConfig.mnemonic) {
      const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(accountConfig.mnemonic.trim()));

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
    } else if (Object.hasOwnProperty('mnemonic')) {
      logger.error(__('accounts error: mnemonic field is specified but its value is undefined'));
    }

    if (accountConfig.secretKey) {
      // Ignore simulator configs
      return null;
    }
    logger.error(__('Unsupported account configuration: %s' ,JSON.stringify(accountConfig)));
    logger.error(__('Check the docs at %s', 'https://framework.embarklabs.io/docs/contracts_deployment.html#Using-accounts-in-a-wallet'.underline));
    return ERROR_ACCOUNT;
  }
}
