import React from 'react';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

import Description from './Description';

const Account = ({account}) => (
  <Row>
    <Col>
      <h1>Account {account.address}</h1>
      <dl class="row">
        <Description label="Balance" value={account.balance} />
        <Description label="Transaction count" value={account.transactionCount} />
      </dl>
    </Col>
  </Row>
);

Account.propTypes = {
  account: PropTypes.object
};

export default Account;
