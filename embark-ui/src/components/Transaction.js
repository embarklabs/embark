import React from 'react';
import {Link} from 'react-router-dom';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

import Description from './Description';

const Transaction = ({transaction}) => (
  <Row>
    <Col>
      <h1>Transaction {transaction.hash}</h1>
      <dl class="row">
        <Description label="Block" value={<Link to={`/embark/explorer/blocks/${transaction.blockNumber}`}>{transaction.blockNumber}</Link>} />
        <Description label="From" value={transaction.from} />
        <Description label="To" value={transaction.to} />
        <Description label="Value" value={`${transaction.value} Wei`}/>
        <Description label="Input" value={transaction.input} />
        <Description label="Gas" value={transaction.gas} />
        <Description label="Gas price" value={`${transaction.gasPrice} Wei`} />
        <Description label="Nonce" value={transaction.nonce} />
      </dl>
    </Col>
  </Row>
);

Transaction.propTypes = {
  transaction: PropTypes.object
};

export default Transaction;
