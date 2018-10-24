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
  <div className="explorer-overview">
    <Row className="mt-4">
      <Col>
        <AccountsContainer />
      </Col>
    </Row>
    <Row>
      <Col xl={6}>
        <BlocksContainer />
      </Col>
      <Col xl={6}>
        <TransactionsContainer />
      </Col>
    </Row>
  </div>
);

export default ExplorerDashboardLayout;
