import React from 'react';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

const Account = ({account}) => (
  <Row>
    <Col>
      <h1>{account.address}</h1>
      <p>Balance: {account.balance}</p>
      <p>Tx count: {account.transactionCount}</p>
    </Col>
  </Row>
);

Account.propTypes = {
  account: PropTypes.object
};

export default Account;
