import React from 'react';
import {Route, Switch} from 'react-router-dom';

import Home from './components/Home';
import NoMatch from './components/NoMatch';
import ExplorerLayout from './components/ExplorerLayout';

import ProcessesContainer from './containers/ProcessesContainer';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark/" component={Home} />
      <Route path="/embark/explorer/" component={ExplorerLayout} />
      <Route path="/embark/processes/" component={ProcessesContainer} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
