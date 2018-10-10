import React from 'react';
import {Route, Switch} from 'react-router-dom';

import HomeContainer from './containers/HomeContainer';
import ContractsContainer from './containers/ContractsContainer';
import ContractLayoutContainer from './containers/ContractLayoutContainer';
import DeploymentContainer from './containers/DeploymentContainer';
import NoMatch from './components/NoMatch';
import ExplorerLayout from './components/ExplorerLayout';
import FiddleLayout from './components/FiddleLayout';
import UtilsLayout from './components/UtilsLayout';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={HomeContainer} />
      <Route path="/embark/explorer/" component={ExplorerLayout} />
      <Route path="/embark/deployment/" component={DeploymentContainer} />
      <Route path="/embark/contracts/:contractName" component={ContractLayoutContainer} />
      <Route path="/embark/contracts" component={ContractsContainer} />
      <Route path="/embark/fiddle" component={FiddleLayout} />
      <Route path="/embark/utilities" component={UtilsLayout} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
