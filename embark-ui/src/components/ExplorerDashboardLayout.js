import React from 'react';
import {
  Col,
  Row
} from "reactstrap";

import AccountsContainer from '../containers/AccountsContainer';
import BlocksContainer from '../containers/BlocksContainer';
import TransactionsContainer from '../containers/TransactionsContainer';

const ExplorerDashboardLayout = () => (
  <React.Fragment>
    <Row>
      <Col>
        <h1 className="my-5">Explorer</h1>
      </Col>
    </Row>
    <Row>
      <Col>
        <AccountsContainer />
      </Col>
    </Row>
    <Row>
      <Col md={6}>
        <BlocksContainer />
      </Col>
      <Col md={6}>
        <TransactionsContainer />
      </Col>
    </Row>
  </React.Fragment>
);

export default ExplorerDashboardLayout;
