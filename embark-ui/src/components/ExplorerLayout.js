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
import CommunicationContainer from '../containers/CommunicationContainer';
import EnsContainer from '../containers/EnsContainer';

const groupItems = [
  {to: "/embark/explorer/accounts", icon: "users", value: "Accounts"},
  {to: "/embark/explorer/blocks", icon: "book-open", value: "Blocks"},
  {to: "/embark/explorer/transactions", icon: "activity", value: "Transactions"},
  {to: "/embark/explorer/communication", icon: "phone-call", value: "Communication"},
  {to: "/embark/explorer/ens", icon: "disc", value: "ENS"}
];

const className = "d-flex align-items-center";

const ExplorerLayout = () => (
  <Grid.Row>
    <Grid.Col md={3}>
      <Page.Title className="my-5">Explorer</Page.Title>
      <div>
        <List.Group transparent={true}>
          {groupItems.map((groupItem) => (
            <List.GroupItem
              key={groupItem.value}
              className={className}
              to={groupItem.to}
              icon={groupItem.icon}
              RootComponent={withRouter(NavLink)}
            >
              {groupItem.value}
            </List.GroupItem>
          ))}
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
        <Route exact path="/embark/explorer/communication" component={CommunicationContainer} />
        <Route exact path="/embark/explorer/ens" component={EnsContainer} />
      </Switch>
    </Grid.Col>
  </Grid.Row>
);

export default ExplorerLayout;
