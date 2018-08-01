import React from 'react';
import { Route, Switch } from 'react-router';
import Home from './components/Home';
import AccountsContainer from './containers/AccountsContainer';
import NoMatch from './components/NoMatch';

const routes = (
  <React.Fragment>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/explorer/accounts" component={AccountsContainer} />
      <Route component={NoMatch} />
    </Switch>
  </React.Fragment>
)

export default routes
