import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {fetchTransaction} from '../actions';
import NoMatch from "../components/NoMatch";
import Transaction from '../components/Transaction';

class TransactionContainer extends Component {
  componentDidMount() {
    this.props.fetchTransaction(this.props.match.params.hash);
  }

  render() {
    const {transaction} = this.props;
    if (!transaction) {
      return <NoMatch />;
    }

    return (
      <React.Fragment>
        <Transaction transactions={transaction} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  if(state.transactions.data) {
    return {transaction: state.transactions.data.find(transaction => transaction.hash === props.match.params.hash)};
  }
  return null;
}

TransactionContainer.propTypes = {
  match: PropTypes.object,
  transaction: PropTypes.object,
  fetchTransaction: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction
  }
)(TransactionContainer));
