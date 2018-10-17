import PropTypes from "prop-types";
import React from 'react';
import connect from "react-redux/es/connect/connect";
import {Route, Switch} from 'react-router-dom';
import {explorerSearch} from "../actions";

import AccountsContainer from '../containers/AccountsContainer';
import AccountContainer from '../containers/AccountContainer';
import BlocksContainer from '../containers/BlocksContainer';
import BlockContainer from '../containers/BlockContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import TransactionContainer from '../containers/TransactionContainer';
import SearchBar from '../components/SearchBar';

const ExplorerLayout = ({explorerSearch}) => (
  <React.Fragment>
    <SearchBar searchSubmit={searchValue => explorerSearch(searchValue)}/>
    <Switch>
      <Route exact path="/embark/explorer/accounts" component={AccountsContainer}/>
      <Route exact path="/embark/explorer/accounts/:address" component={AccountContainer}/>
      <Route exact path="/embark/explorer/blocks" component={BlocksContainer}/>
      <Route exact path="/embark/explorer/blocks/:blockNumber" component={BlockContainer}/>
      <Route exact path="/embark/explorer/transactions" component={TransactionsContainer}/>
      <Route exact path="/embark/explorer/transactions/:hash" component={TransactionContainer}/>
    </Switch>
  </React.Fragment>
);

ExplorerLayout.propTypes = {
  explorerSearch: PropTypes.func
};

// function mapStateToProps(state) {
//   return {accounts: getAccounts(state), error: state.errorMessage, loading: state.loading};
// }

export default connect(
  null,
  {
    explorerSearch: explorerSearch.request
  },
)(ExplorerLayout);
