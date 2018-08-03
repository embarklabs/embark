import React from 'react';
import {
  Page
} from "tabler-react";
import PropTypes from 'prop-types';


const Transaction = ({transaction}) => (
  <Page.Content title={`Transaction ${transaction.hash}`}>
    <p>Hello</p>
  </Page.Content>
);

Transaction.propTypes = {
  transaction: PropTypes.object
};

export default Transaction;
