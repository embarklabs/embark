import React from 'react';
import {Route, Switch} from 'react-router-dom';

import HomeContainer from './containers/HomeContainer';
import ContractsContainer from './containers/ContractsContainer';
import ContractContainer from './containers/ContractLayoutContainer';
import NoMatch from './components/NoMatch';
import ExplorerLayout from './components/ExplorerLayout';
import FiddleLayout from './components/FiddleLayout';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={HomeContainer} />
      <Route path="/embark/explorer/" component={ExplorerLayout} />
      <Route path="/embark/contracts/:contractName" component={ContractContainer} />
      <Route path="/embark/contracts" component={ContractsContainer} />
      <Route path="/embark/fiddle" component={FiddleLayout} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
