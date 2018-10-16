import React from 'react';
import {NavLink as RouterNavLink, Route, Switch} from 'react-router-dom';
import {
  Row,
  Col,
  Nav,
  NavItem,
  NavLink
} from "reactstrap";

import AccountsContainer from '../containers/AccountsContainer';
import AccountContainer from '../containers/AccountContainer';
import BlocksContainer from '../containers/BlocksContainer';
import BlockContainer from '../containers/BlockContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import TransactionContainer from '../containers/TransactionContainer';

const groupItems = [
  {to: "/embark/explorer/overview", icon: "signal", value: "Overview"},
  {to: "/embark/explorer/accounts", icon: "users", value: "Accounts"},
  {to: "/embark/explorer/blocks", icon: "stop", value: "Blocks"},
  {to: "/embark/explorer/transactions", icon: "tree", value: "Transactions"}
];

const className = "d-flex align-items-center";

const ExplorerLayout = (props) => (
  <Row>
    <Col md={2}>
      <h1 className="my-5">Explorer</h1>
      <div>
        <Nav vertical pills>
          {groupItems.map((groupItem) => (
            <NavItem 
              key={groupItem.value}>
              <NavLink
                className={className}
                to={groupItem.to}
                tag={RouterNavLink}
              >
                <i className={`fa fa-${groupItem.icon} mr-3`} />{groupItem.value}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      </div>
    </Col>
    <Col md={10}>
      <Switch>
        <Route exact path="/embark/explorer/accounts" component={AccountsContainer} />
        <Route exact path="/embark/explorer/accounts/:address" component={AccountContainer} />
        <Route exact path="/embark/explorer/blocks" component={BlocksContainer} />
        <Route exact path="/embark/explorer/blocks/:blockNumber" component={BlockContainer} />
        <Route exact path="/embark/explorer/transactions" component={TransactionsContainer} />
        <Route exact path="/embark/explorer/transactions/:hash" component={TransactionContainer} />
      </Switch>
    </Col>
  </Row>
);

export default ExplorerLayout;
