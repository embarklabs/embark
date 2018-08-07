import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {transaction as transactionAction} from '../actions';
import Transaction from '../components/Transaction';
import DataWrapper from "../components/DataWrapper";
import {getTransaction} from "../reducers/selectors";

class TransactionContainer extends Component {
  componentDidMount() {
    this.props.fetchTransaction(this.props.match.params.hash);
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.transaction !== undefined } {...this.props} render={({transaction}) => (
        <Transaction transaction={transaction} />
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    transaction: getTransaction(state, props.match.params.hash),
    error: state.errorMessage,
    loading: state.loading
  };
}

TransactionContainer.propTypes = {
  match: PropTypes.object,
  transaction: PropTypes.object,
  transactions: PropTypes.arrayOf(PropTypes.object),
  fetchTransaction: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction: transactionAction.request
  }
)(TransactionContainer));
