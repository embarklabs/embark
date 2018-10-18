import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardTitle, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Transactions = ({transactions}) => (
  <Row>
    <Col>
      <h1>Transactions</h1>
      {transactions.map(transaction => (
        <Card>
          <CardHeader>
            <Link to={`/embark/explorer/transactions/${transaction.hash}`}>
              <CardTitleIdenticon id={transaction.hash}>Transaction {transaction.hash}</CardTitleIdenticon>
            </Link>
          </CardHeader>
          <CardBody>
            <Row>
              <Col>
                <strong>Block number</strong>
                <br/>
                {transaction.blockNumber}
              </Col>
              <Col>
                <strong>From</strong>
                <br/>
                {transaction.from}
              </Col>
              <Col>
                <strong>To</strong>
                <br/>
                {transaction.to}
              </Col>
              <Col>
                <strong>Type</strong>
                <br/>
                {transaction.to ? "Contract Call" : "Contract Creation"}
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
