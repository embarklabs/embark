import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {transactions as transactionsAction} from '../actions';
import Transactions from '../components/Transactions';
import Loading from '../components/Loading';
import LoadMore from '../components/LoadMore';
import Error from '../components/Error';

class TransactionsContainer extends Component {
  componentDidMount() {
    this.props.fetchTransactions();
  }

  loadMore() {
    this.props.fetchTransactions(this.loadMoreFrom());
  }

  loadMoreFrom() {
    let transactions = this.props.transactions.data;
    return transactions[transactions.length - 1].blockNumber - 1;
  }

  render() {
    const {transactions} = this.props;
    if (transactions.error) {
      return <Error error={transactions.error} />;
    }

    if (!transactions.data) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <Transactions transactions={transactions.data}/>
        {(this.loadMoreFrom() > 0) ? <LoadMore loadMore={() => this.loadMore()} /> : <React.Fragment />}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {transactions: state.transactions};
}

TransactionsContainer.propTypes = {
  transactions: PropTypes.object,
  fetchTransactions: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchTransactions: transactionsAction.request
  },
)(TransactionsContainer);
