import React from 'react';
import {Route, Switch} from 'react-router';
import Home from './components/Home';
import AccountsContainer from './containers/AccountsContainer';
import ProcessesContainer from './containers/ProcessesContainer';
import NoMatch from './components/NoMatch';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/embark" component={Home} />
      <Route path="/embark/explorer/accounts" component={AccountsContainer} />
      <Route path="/embark/processes" component={ProcessesContainer} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
);

export default routes;
