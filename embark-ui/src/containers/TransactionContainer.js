import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {fetchTransaction} from '../actions';
import Transaction from '../components/Transaction';
import Loading from '../components/Loading';

class TransactionContainer extends Component {
  componentDidMount() {
    this.props.fetchTransaction(this.props.router.match.params.hash);
  }

  render() {
    const {transaction} = this.props;
    if (!transaction.data) {
      return <Loading />;
    }

    if (transaction.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      );
    }

    return (
      <React.Fragment>
        <Transaction transactions={transaction.data} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {transaction: state.transaction};
}

TransactionContainer.propTypes = {
  router: PropTypes.object,
  transaction: PropTypes.object,
  fetchTransaction: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction
  }
))(TransactionContainer);
