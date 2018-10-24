import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {transactions as transactionsAction, initBlockHeader, stopBlockHeader} from '../actions';
import Transactions from '../components/Transactions';
import DataWrapper from "../components/DataWrapper";
import {getTransactions} from "../reducers/selectors";

const MAX_TXS = 10; // TODO use same constant as API

class TransactionsContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {currentPage: 0};
    this.numberOfTxs = 0;
    this.currentTxs = [];
  }

  componentDidMount() {
    this.props.fetchTransactions();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  getNumberOfPages() {
    if (!this.numberOfTxs) {
      let transactions = this.props.transactions;
      if (transactions.length === 0) {
        this.numberOfTxs = 0;
      } else {
        this.numberOfTxs = transactions[transactions.length - 1].blockNumber - 1;
      }
    }
    return Math.ceil(this.numberOfTxs / MAX_TXS);
  }

  changePage(newPage) {
    this.setState({currentPage: newPage});

    this.props.fetchTransactions((newPage * MAX_TXS) + MAX_TXS);
  }

  getCurrentTransactions() {
    const currentPage = this.state.currentPage || this.getNumberOfPages();
    return this.props.transactions.filter(tx => tx.blockNumber <= (currentPage * MAX_TXS) + MAX_TXS &&
      tx.blockNumber > currentPage * MAX_TXS);
  }

  render() {
    const newTxs = this.getCurrentTransactions();
    if (newTxs.length) {
      this.currentTxs = newTxs;
    }
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.currentTxs.length > 0} {...this.props} render={() => (
          <Transactions transactions={this.currentTxs} numberOfPages={this.getNumberOfPages()}
                        changePage={(newPage) => this.changePage(newPage)}
                        currentPage={this.state.currentPage || this.getNumberOfPages()} />
        )} />
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
  initBlockHeader: PropTypes.func,
  stopBlockHeader: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchTransactions: transactionsAction.request,
    initBlockHeader,
    stopBlockHeader
  },
)(TransactionsContainer);
