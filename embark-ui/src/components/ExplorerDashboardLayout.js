import React from 'react';
import {
  Col,
  Row
} from "reactstrap";

import AccountsContainer from '../containers/AccountsContainer';
import BlocksContainer from '../containers/BlocksContainer';
import TransactionsContainer from '../containers/TransactionsContainer';

import './Explorer.css';

const ExplorerDashboardLayout = () => (
  <React.Fragment>
    <Row className="mt-4">
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
