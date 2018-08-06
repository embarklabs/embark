import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {accounts as accountsAction} from '../actions';
import Accounts from '../components/Accounts';
import Loading from '../components/Loading';
import Error from '../components/Error';

class AccountsContainer extends Component {
  componentDidMount() {
    this.props.fetchAccounts();
  }

  render() {
    const {accounts} = this.props;
    if (accounts.error) {
      return <Error error={accounts.error} />;
    }

    if (!accounts.data) {
      return <Loading />;
    }

    return (
      <Accounts accounts={accounts.data} />
    );
  }
}

function mapStateToProps(state) {
  return {accounts: state.accounts};
}

AccountsContainer.propTypes = {
  accounts: PropTypes.object,
  fetchAccounts: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchAccounts: accountsAction.request
  },
)(AccountsContainer);
