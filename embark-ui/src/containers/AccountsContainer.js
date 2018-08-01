import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchAccounts } from '../actions';
import Accounts from '../components/Accounts';

class AccountsContainer extends Component {
  componentWillMount() {
    this.props.fetchAccounts();
  }

  render() {
    const { accounts } = this.props;
    if (!accounts.data) {
      return (
        <h1>
          <i>Loading accounts...</i>
        </h1>
      )
    }

    if (accounts.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      )
    }

    return (
      <Accounts accounts={accounts.data} />
    );
  }
};

function mapStateToProps(state) {
  return { accounts: state.accounts }
}

export default connect(
  mapStateToProps,
  {
    fetchAccounts
  },
)(AccountsContainer)
