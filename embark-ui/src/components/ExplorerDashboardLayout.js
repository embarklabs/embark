import React from 'react';
import {
  Page,
  Grid
} from "tabler-react";

import AccountsContainer from '../containers/AccountsContainer';
import BlocksContainer from '../containers/BlocksContainer';
import TransactionsContainer from '../containers/TransactionsContainer';

const ExplorerDashboardLayout = () => (
  <React.Fragment>
    <Grid.Row md={12}>
      <Grid.Col>
        <Page.Title className="my-5">Explorer</Page.Title>
      </Grid.Col>
    </Grid.Row>
    <Grid.Row>
      <Grid.Col className="pl-md-0 pr-md-0 ml-md-0 mr-md-0 pr-lg-3 mr-lg-3 pl-lg-2 ml-lg-2">
        <AccountsContainer />
      </Grid.Col>
    </Grid.Row>
    <Grid.Row>
      <Grid.Col md={6}>
        <BlocksContainer />
      </Grid.Col>
      <Grid.Col md={6}>
        <TransactionsContainer />
      </Grid.Col>
    </Grid.Row>
  </React.Fragment>
);

export default ExplorerDashboardLayout;
