import React from 'react';

const ContractContext = React.createContext({
  accounts: [],
  instances: [],
  updateAccounts: () => {
  },
  updateInstances: (_instance) => {
  }
});

export default ContractContext;
