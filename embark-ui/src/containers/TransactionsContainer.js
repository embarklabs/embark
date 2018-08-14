import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {transactions as transactionsAction} from '../actions';
import LoadMore from "../components/LoadMore";
import Transactions from '../components/Transactions';
import DataWrapper from "../components/DataWrapper";
import {getTransactions} from "../reducers/selectors";

class TransactionsContainer extends Component {
  componentDidMount() {
    this.props.fetchTransactions();
  }

  loadMore() {
    this.props.fetchTransactions(this.loadMoreFrom());
  }

  loadMoreFrom() {
    let transactions = this.props.transactions;
    if (transactions.length === 0) {
      return 0;
    }
    return transactions[transactions.length - 1].blockNumber - 1;
  }

  render() {
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.props.transactions.length > 0} {...this.props} render={({transactions}) => (
          <Transactions transactions={transactions} />
        )} />
        {(this.loadMoreFrom() > 0) ? <LoadMore loadMore={() => this.loadMore()} /> : <React.Fragment />}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {transactions: getTransactions(state), error: state.errorMessage, loading: state.loading};
}

TransactionsContainer.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  fetchTransactions: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchTransactions: transactionsAction.request
  },
)(TransactionsContainer);
