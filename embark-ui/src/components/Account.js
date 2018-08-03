import React from 'react';
import {
  Page
} from "tabler-react";
import PropTypes from 'prop-types';


const Account = ({account}) => (
  <Page.Content title={`Account ${account.address}`}>
    <p>Hello</p>
  </Page.Content>
);

Account.propTypes = {
  account: PropTypes.object
};

export default Account;
