const MAINNET_ID = '1';
const ROPSTEN_ID = '3';
const RINKEBY_ID = '4';

export default {
  [MAINNET_ID]: {
    "ENSRegistry": {
      "address": "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
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
