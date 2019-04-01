import React from 'react';
import {
  Col,
  Row
} from "reactstrap";

import AccountsContainer from '../containers/AccountsContainer';
import BlocksContainer from '../containers/BlocksContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import PageHead from '../components/PageHead';

import './Explorer.css';

const ExplorerDashboardLayout = () => (
  <React.Fragment>
    <PageHead title="Explorer Overview" description="Summary view of the Accounts configured for Embark, recent blocks, and recent transactions" />
    <div className="explorer-overview">
      <Row>
        <Col>
          <AccountsContainer numAccountsToDisplay={2} overridePageHead={false} />
        </Col>
      </Row>
      <Row>
        <Col xl={6}>
          <BlocksContainer numBlocksToDisplay={5} overridePageHead={false} />
        </Col>
        <Col xl={6}>
          <TransactionsContainer numTxsToDisplay={3} overridePageHead={false} />
        </Col>
      </Row>
    </div>
  </React.Fragment>
);

export default ExplorerDashboardLayout;
