const ContractContext = React.createContext({
    accounts: [],
    instances: [],
    updateAccounts: () => {},
    updateInstances: (_instance) => {}

});
