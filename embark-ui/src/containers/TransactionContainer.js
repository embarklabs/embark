import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {transaction as transactionAction} from '../actions';
import Error from "../components/Error";
import NoMatch from "../components/NoMatch";
import Transaction from '../components/Transaction';

class TransactionContainer extends Component {
  componentDidMount() {
    this.props.fetchTransaction(this.props.match.params.hash);
  }

  render() {
    const {transaction, error} = this.props;
    if (error) {
      return <Error error={error} />;
    }
    if (!transaction) {
      return <NoMatch />;
    }

    return (
      <React.Fragment>
        <Transaction transaction={transaction} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  if(state.transactions.error) {
    return {error: state.transactions.error};
  }
  if(state.transactions.data) {
    return {transaction: state.transactions.data.find(transaction => transaction.hash === props.match.params.hash)};
  }
  return {};
}

TransactionContainer.propTypes = {
  match: PropTypes.object,
  transaction: PropTypes.object,
  fetchTransaction: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction: transactionAction.request
  }
)(TransactionContainer));
