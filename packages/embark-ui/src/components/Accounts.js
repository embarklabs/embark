import React from 'react';
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Accounts = ({accounts}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>Accounts</h2>
        </CardHeader>
        <CardBody>
          {accounts.map(account => (
            <div className="explorer-row border-top" key={account.address}>
              <CardTitleIdenticon id={account.address}>Account&nbsp;
                <Link to={`/explorer/accounts/${account.address}`}>{account.address}</Link>
              </CardTitleIdenticon>
              <Row>
                <Col>
                  <strong>Balance</strong>
                  <div>{account.balance} Ether</div>
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
            </div>
          ))}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object)
};

export default Accounts;
