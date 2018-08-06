import React from 'react';
import {
  Page
} from "tabler-react";
import PropTypes from 'prop-types';

const Account = ({account}) => (
  <Page.Content title={`Account ${account.address}`}>
    <p>Balance: {account.balance}</p>
    <p>Tx count: {account.transactionCount}</p>
  </Page.Content>
);

Account.propTypes = {
  account: PropTypes.object
};

export default Account;
