import React from 'react';
import {Route, Switch} from 'react-router-dom';

import HomeContainer from './containers/HomeContainer';
import EditorContainer from './containers/EditorContainer';
import DeploymentContainer from './containers/DeploymentContainer';
import NoMatch from './components/NoMatch';
import ExplorerDashboardLayout from './components/ExplorerDashboardLayout';
import ExplorerLayout from './components/ExplorerLayout';
import UtilsLayout from './components/UtilsLayout';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={HomeContainer} />
      <Route exact path="/embark/explorer/overview" component={ExplorerDashboardLayout} />
      <Route path="/embark/explorer" component={ExplorerLayout} />
      <Route path="/embark/deployment/" component={DeploymentContainer} />
      <Route path="/embark/editor" component={EditorContainer} />
      <Route path="/embark/utilities" component={UtilsLayout} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
