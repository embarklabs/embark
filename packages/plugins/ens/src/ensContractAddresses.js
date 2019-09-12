const MAINNET_ID = '1';
const ROPSTEN_ID = '3';
const RINKEBY_ID = '4';

export default {
  [MAINNET_ID]: {
    "ENSRegistry": {
      "address": "0x314159265dd8dbb310642f98f50c066173c1259b",
      "silent": true
    },
    "Resolver": {
      "deploy": false
    },
    "FIFSRegistrar": {
      "deploy": false
    }
  },
  [ROPSTEN_ID]: {
    "ENSRegistry": {
      "address": "0x112234455c3a32fd11230c42e7bccd4a84e02010",
      "silent": true
    },
    "Resolver": {
      "deploy": false
    },
    "FIFSRegistrar": {
      "deploy": false
    }
  },
  [RINKEBY_ID]: {
    "ENSRegistry": {
      "address": "0xe7410170f87102DF0055eB195163A03B7F2Bff4A",
      "silent": true
    },
    "Resolver": {
      "deploy": false
    },
    "FIFSRegistrar": {
      "deploy": false
    }
  }
};
