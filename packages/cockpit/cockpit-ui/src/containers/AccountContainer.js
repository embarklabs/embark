import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {account as accountAction,
        initBlockHeader,
        stopBlockHeader,
        transactions as transactionsAction} from '../actions';
import Account from '../components/Account';
import DataWrapper from "../components/DataWrapper";
import Transactions from '../components/Transactions';
import PageHead from '../components/PageHead';
import {getAccount, getTransactionsByAccount} from "../reducers/selectors";

class AccountContainer extends Component {
  componentDidMount() {
    this.props.fetchAccount(this.props.match.params.address);
    this.props.fetchTransactions();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title={`Account ${this.props.match.params.address}`} description={`Details of address ${this.props.match.params.address} and a summary view of it's recent transactions`} />
        <DataWrapper shouldRender={this.props.account !== undefined } {...this.props} render={({account, transactions}) => (
          <React.Fragment>
            <Account account={account} />
            <Transactions transactions={transactions || []} />
          </React.Fragment>
        )} />
      </React.Fragment>
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
    fetchAccount: accountAction.request,
    fetchTransactions: transactionsAction.request,
    initBlockHeader,
    stopBlockHeader
  }
)(AccountContainer));
