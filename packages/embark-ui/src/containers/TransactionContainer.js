import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {transaction as transactionAction, contracts as contractsAction} from '../actions';
import Transaction from '../components/Transaction';
import DataWrapper from "../components/DataWrapper";
import PageHead from "../components/PageHead";
import {getTransaction, getContracts} from "../reducers/selectors";

class TransactionContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
    this.props.fetchTransaction(this.props.match.params.hash);
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title={`Transaction ${this.props.match.params.hash}`} description={`View details of transaction ${this.props.match.params.hash}`} />
        <DataWrapper shouldRender={this.props.transaction !== undefined } {...this.props} render={({transaction}) => (
          <Transaction contracts={this.props.contracts} transaction={transaction} />
        )} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    transaction: getTransaction(state, props.match.params.hash),
    contracts: getContracts(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

TransactionContainer.propTypes = {
  match: PropTypes.object,
  transaction: PropTypes.object,
  contracts: PropTypes.arrayOf(PropTypes.object),
  fetchContracts: PropTypes.func,
  fetchTransaction: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContracts: contractsAction.request,
    fetchTransaction: transactionAction.request
  }
)(TransactionContainer));
