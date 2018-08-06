import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {account as accountAction} from '../actions';
import Account from '../components/Account';
import NoMatch from "../components/NoMatch";
import Transactions from '../components/Transactions';
import Error from '../components/Error';

class AccountContainer extends Component {
  componentDidMount() {
    this.props.fetchAccount(this.props.match.params.address);
  }

  render() {
    const {account, error} = this.props;
    if (error) {
      return <Error error={error} />;
    }

    if (!account) {
      return <NoMatch />;
    }

    return (
      <React.Fragment>
        <Account account={account} />
        <Transactions transactions={account.transactions || []} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  if(state.accounts.error) {
    return {error: state.accounts.error};
  }
  if(state.accounts.data) {
    return {account: state.accounts.data.find(account => account.address === props.match.params.address)};
  }
  return {};
}

AccountContainer.propTypes = {
  match: PropTypes.object,
  account: PropTypes.object,
  fetchAccount: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchAccount: accountAction.request
  }
)(AccountContainer));
