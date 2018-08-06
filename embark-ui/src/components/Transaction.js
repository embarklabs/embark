import React from 'react';
import {Link} from 'react-router-dom';
import {
  Page
} from "tabler-react";
import PropTypes from 'prop-types';

const Transaction = ({transaction}) => (
  <Page.Content title={`Transaction ${transaction.hash}`}>
    <p>Block: <Link to={`/embark/explorer/blocks/${transaction.blockNumber}`}>{transaction.blockNumber}</Link></p>
    <p>From: {transaction.from}</p>
    <p>To: {transaction.to}</p>
    <p>Input: {transaction.input}</p>
    <p>Gas: {transaction.gas}</p>
    <p>Gas Price: {transaction.gasPrice}</p>
    <p>Nonce: {transaction.nonce}</p>
  </Page.Content>
);

Transaction.propTypes = {
  transaction: PropTypes.object
};

export default Transaction;
