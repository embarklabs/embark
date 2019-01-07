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
      <Route exact path="/" component={HomeContainer} />
      <Route exact path="/explorer/overview" component={ExplorerDashboardLayout} />
      <Route path="/explorer" component={ExplorerLayout} />
      <Route path="/deployment/" component={DeploymentContainer} />
      <Route path="/editor" component={EditorContainer} />
      <Route path="/utilities" component={UtilsLayout} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
