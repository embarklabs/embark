import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {account as accountAction} from '../actions';
import Account from '../components/Account';
import DataWrapper from "../components/DataWrapper";
import Transactions from '../components/Transactions';
import {getAccount, getTransactionsByAccount} from "../reducers/selectors";

class AccountContainer extends Component {
  componentDidMount() {
    this.props.fetchAccount(this.props.match.params.address);
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.account !== undefined } {...this.props} render={({account, transactions}) => (
        <React.Fragment>
          <Account account={account} />
          <Transactions transactions={transactions || []} />
        </React.Fragment>
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    account: getAccount(state, props.match.params.address),
    transactions: getTransactionsByAccount(state, props.match.params.address),
    error: state.errorMessage,
    loading: state.loading
  };
}

AccountContainer.propTypes = {
  match: PropTypes.object,
  account: PropTypes.object,
  transactions: PropTypes.arrayOf(PropTypes.object),
  fetchAccount: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchAccount: accountAction.request
  }
)(AccountContainer));
