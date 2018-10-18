import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Transactions = ({transactions}) => (
  <Row>
    <Col>
      <h1>Transactions</h1>
      {transactions.map(transaction => (
        <Card key={transaction.hash}>
          <CardHeader>
            <Link to={`/embark/explorer/transactions/${transaction.hash}`}>
              <CardTitleIdenticon id={transaction.hash}>Transaction {transaction.hash}</CardTitleIdenticon>
            </Link>
          </CardHeader>
          <CardBody>
            <Row>
              <Col>
                <strong>Block number</strong>
                <div>{transaction.blockNumber}</div>
              </Col>
              <Col>
                <strong>From</strong>
                <div>{transaction.from}</div>
              </Col>
              <Col>
                <strong>To</strong>
                <div>{transaction.to}</div>
              </Col>
              <Col>
                <strong>Type</strong>
                <div>{transaction.to ? "Contract Call" : "Contract Creation"}</div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      ))}
    </Col>
  </Row>
);

Transactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object)
};

export default Transactions;
