import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {fetchAccount} from '../actions';
import Account from '../components/Account';
import NoMatch from "../components/NoMatch";
import Transactions from '../components/Transactions';

class AccountContainer extends Component {
  componentDidMount() {
    this.props.fetchAccount(this.props.match.params.address);
  }

  render() {
    const {account} = this.props;
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
  if(state.accounts.data) {
    return {account: state.accounts.data.find(account => account.address === props.match.params.address)};
  }
  return null;
}

AccountContainer.propTypes = {
  match: PropTypes.object,
  account: PropTypes.object,
  fetchAccount: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchAccount
  }
)(AccountContainer));
