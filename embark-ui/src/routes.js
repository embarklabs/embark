import React from 'react';
import {Route, Switch} from 'react-router-dom';

import HomeContainer from './containers/HomeContainer';
import ContractsContainer from './containers/ContractsContainer';
import NoMatch from './components/NoMatch';
import ExplorerLayout from './components/ExplorerLayout';
import ProcessesLayout from './components/ProcessesLayout';
import ContractLayout from './components/ContractLayout';
import FiddleContainer from './containers/FiddleContainer';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={HomeContainer} />
      <Route path="/embark/explorer/" component={ExplorerLayout} />
      <Route path="/embark/processes/" component={ProcessesLayout} />
      <Route path="/embark/explorer/accounts" component={AccountsContainer} />
      <Route path="/embark/contracts/:contractName" component={ContractLayout} />
      <Route path="/embark/contracts" component={ContractsContainer} />
      <Route path="/embark/fiddle" component={FiddleContainer} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
