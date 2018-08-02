import React from 'react';
import {Route, Switch} from 'react-router-dom';

import HomeContainer from './containers/HomeContainer';
import AccountsContainer from './containers/AccountsContainer';
import ContractsContainer from './containers/ContractsContainer';
import ContractContainer from './containers/ContractContainer';
import NoMatch from './components/NoMatch';
import ExplorerLayout from './components/ExplorerLayout';
import ProcessesLayout from './components/ProcessesLayout';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={HomeContainer} />
      <Route path="/embark/explorer/" component={ExplorerLayout} />
      <Route path="/embark/processes/" component={ProcessesLayout} />
      <Route path="/embark/explorer/accounts" component={AccountsContainer} />
      <Route path="/embark/contracts/:contractName" component={ContractContainer} />
      <Route path="/embark/contracts" component={ContractsContainer} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
