import React from 'react';
import {NavLink, Route, Switch, withRouter} from 'react-router-dom';
import {
  Page,
  Grid,
  List
} from "tabler-react";

import AccountsContainer from '../containers/AccountsContainer';
import AccountContainer from '../containers/AccountContainer';
import BlocksContainer from '../containers/BlocksContainer';
import BlockContainer from '../containers/BlockContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import TransactionContainer from '../containers/TransactionContainer';

const ExplorerLayout = () => (
  <Grid.Row>
    <Grid.Col md={3}>
      <Page.Title className="my-5">Explorer</Page.Title>
      <div>
        <List.Group transparent={true}>
          <List.GroupItem
            className="d-flex align-items-center"
            to="/embark/explorer/accounts"
            icon="users"
            RootComponent={withRouter(NavLink)}
          >
            Accounts
          </List.GroupItem>
          <List.GroupItem
            className="d-flex align-items-center"
            to="/embark/explorer/blocks"
            icon="book-open"
            RootComponent={withRouter(NavLink)}
          >
            Blocks
          </List.GroupItem>
          <List.GroupItem
            className="d-flex align-items-center"
            to="/embark/explorer/transactions"
            icon="activity"
            RootComponent={withRouter(NavLink)}
          >
            Transactions
          </List.GroupItem>
        </List.Group>
      </div>
    </Grid.Col>
    <Grid.Col md={9}>
      <Switch>
        <Route exact path="/embark/explorer/accounts" component={AccountsContainer} />
        <Route exact path="/embark/explorer/accounts/:address" component={AccountContainer} />
        <Route exact path="/embark/explorer/blocks" component={BlocksContainer} />
        <Route exact path="/embark/explorer/blocks/:blockNumber" component={BlockContainer} />
        <Route exact path="/embark/explorer/transactions" component={TransactionsContainer} />
        <Route exact path="/embark/explorer/transactions/:hash" component={TransactionContainer} />
      </Switch>
    </Grid.Col>
  </Grid.Row>
);

export default ExplorerLayout;
