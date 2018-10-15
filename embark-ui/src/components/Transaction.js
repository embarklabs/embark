import React from 'react';
import {Link} from 'react-router-dom';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

const Transaction = ({transaction}) => (
  <Row>
    <Col>
      <h1>Transaction {transaction.hash}</h1>
      <p>Block: <Link to={`/embark/explorer/blocks/${transaction.blockNumber}`}>{transaction.blockNumber}</Link></p>
      <p>From: {transaction.from}</p>
      <p>To: {transaction.to}</p>
      <p>Input: {transaction.input}</p>
      <p>Gas: {transaction.gas}</p>
      <p>Gas Price: {transaction.gasPrice}</p>
      <p>Nonce: {transaction.nonce}</p>
    </Col>
  </Row>
);

Transaction.propTypes = {
  transaction: PropTypes.object
};

export default Transaction;
