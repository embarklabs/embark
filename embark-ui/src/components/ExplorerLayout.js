import PropTypes from "prop-types";
import React from 'react';
import connect from "react-redux/es/connect/connect";
import {Route, Switch, withRouter} from 'react-router-dom';
import {explorerSearch} from "../actions";
import {searchResult} from "../reducers/selectors";

import AccountsContainer from '../containers/AccountsContainer';
import AccountContainer from '../containers/AccountContainer';
import BlocksContainer from '../containers/BlocksContainer';
import BlockContainer from '../containers/BlockContainer';
import TransactionsContainer from '../containers/TransactionsContainer';
import TransactionContainer from '../containers/TransactionContainer';
import SearchBar from '../components/SearchBar';

class ExplorerLayout extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.searchResult && nextProps.searchResult !== this.props.searchResult) {
      console.log('New result', nextProps.searchResult);
      if (nextProps.searchResult.address) {
        this.props.history.push(`/embark/explorer/accounts/${nextProps.searchResult.address}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('transactionIndex')) {
        this.props.history.push(`/embark/explorer/transactions/${nextProps.searchResult.hash}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('number')) {
        this.props.history.push(`/embark/explorer/blocks/${nextProps.searchResult.number}`);
        return false;
      }
      // Returned something we didn't know existed
    }
    return true;
  }

  render() {
    const {explorerSearch} = this.props;
    return (
      <React.Fragment>
        <SearchBar searchSubmit={searchValue => explorerSearch(searchValue)}/>
        {searchResult && <span>{JSON.stringify(searchResult)}</span>}
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
  }
}

ExplorerLayout.propTypes = {
  explorerSearch: PropTypes.func,
  searchResult: PropTypes.object,
  history: PropTypes.object
};

function mapStateToProps(state) {
  return {searchResult: searchResult(state)};
}

export default withRouter(connect(
  mapStateToProps,
  {
    explorerSearch: explorerSearch.request
  },
)(ExplorerLayout));
