import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {fetchAccounts} from '../actions';
import Accounts from '../components/Accounts';
import Loading from '../components/Loading';

class AccountsContainer extends Component {
  componentDidMount() {
    this.props.fetchAccounts();
  }

  render() {
    const {accounts} = this.props;
    if (!accounts.data) {
      return <Loading />;
    }

    if (accounts.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      );
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
    fetchAccounts
  },
)(AccountsContainer);
