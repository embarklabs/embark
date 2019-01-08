import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {accounts as accountsAction} from '../actions';
import Accounts from '../components/Accounts';
import DataWrapper from "../components/DataWrapper";
import {getAccounts} from "../reducers/selectors";
import PageHead from "../components/PageHead";

class AccountsContainer extends Component {
  componentDidMount() {
    this.props.fetchAccounts();
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title="Accounts" enabled={this.props.overridePageHead} description="Summary view of the accounts configured for Embark" />
        <DataWrapper shouldRender={this.props.accounts.length > 0} {...this.props} render={({accounts}) => (
          <Accounts accounts={accounts} />
        )} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {accounts: getAccounts(state), error: state.errorMessage, loading: state.loading};
}

AccountsContainer.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  fetchAccounts: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
  overridePageHead: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchAccounts: accountsAction.request
  },
)(AccountsContainer);
