import React from 'react';
import {Route, Switch} from 'react-router-dom';

import AccountsContainer from '../containers/AccountsContainer';
import AccountContainer from '../containers/AccountContainer';
import BlocksContainer from '../containers/BlocksContainer';
import BlockContainer from '../containers/BlockContainer';
import ContractsContainer from '../containers/ContractsContainer';
import ContractLayoutContainer from '../containers/ContractLayoutContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import TransactionContainer from '../containers/TransactionContainer';

const ExplorerLayout = () => (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/explorer/accounts" component={AccountsContainer}/>
      <Route exact path="/embark/explorer/accounts/:address" component={AccountContainer}/>
      <Route exact path="/embark/explorer/blocks" component={BlocksContainer}/>
      <Route exact path="/embark/explorer/blocks/:blockNumber" component={BlockContainer}/>
      <Route exact path="/embark/explorer/contracts" component={ContractsContainer} />
      <Route exact path="/embark/explorer/contracts/:contractName" component={ContractLayoutContainer} />
      <Route exact path="/embark/explorer/transactions" component={TransactionsContainer}/>
      <Route exact path="/embark/explorer/transactions/:hash" component={TransactionContainer}/>
    </Switch>
  </React.Fragment>
);

export default ExplorerLayout;
