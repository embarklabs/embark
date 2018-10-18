import React from 'react';
import {Row, Col, Card, CardHeader, CardTitle, CardBody} from 'reactstrap';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Accounts = ({accounts}) => (
  <Row>
    <Col>
      <h1>Accounts</h1>
      {accounts.map(account => (
        <Card>
          <CardHeader>
            <Link to={`/embark/explorer/accounts/${account.address}`}>
              <CardTitleIdenticon id={account.address}>Account {account.address}</CardTitleIdenticon>
            </Link>
          </CardHeader>
          <CardBody>
            <Row>
              <Col>
                <strong>Balance</strong>
                <div>{account.balance} Wei</div>
              </Col>
              <Col>
                <strong>Tx Count</strong>
                <div>{account.transactionCount}</div>
              </Col>
              <Col>
                <strong>Index</strong>
                <div>{account.index}</div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      ))}
    </Col>
  </Row>
);

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object)
};

export default Accounts;
