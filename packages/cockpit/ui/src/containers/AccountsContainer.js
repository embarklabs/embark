import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {accounts as accountsAction,
        initBlockHeader,
        stopBlockHeader} from '../actions';
import Accounts from '../components/Accounts';
import {getAccounts} from "../reducers/selectors";
import PageHead from "../components/PageHead";

const MAX_ACCOUNTS = 10;

class AccountsContainer extends Component {
  constructor(props) {
    super(props);

    this.numAccountsToDisplay = this.props.numAccountsToDisplay || MAX_ACCOUNTS;
    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchAccounts();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  get numberOfAccounts() {
    if (this._numberOfAccounts === undefined) {
      this._numberOfAccounts = this.props.accounts.length;
    }
    return this._numberOfAccounts;
  }

  get numberOfPages() {
    if (this._numberOfPages === undefined) {
      this._numberOfPages = Math.ceil(
        this.numberOfAccounts / this.numAccountsToDisplay
      );
    }
    return this._numberOfPages;
  }

  resetNums() {
    this._numberOfAccounts = undefined;
    this._numberOfPages = undefined;
  }

  changePage(newPage) {
    if (newPage <= 0) {
      newPage = 1;
    } else if (newPage > this.numberOfPages) {
      newPage = this.numberOfPages;
    }
    this.setState({ currentPage: newPage });
    this.props.fetchAccounts();
  }

  get currentAccounts() {
    return this.props.accounts
      .filter((account) => {
        const index = (
          (account.index + 1) -
            (this.numAccountsToDisplay * (this.state.currentPage - 1))
        );
        return index <= this.numAccountsToDisplay && index > 0;
      });
  }

  render() {
    this.resetNums();
    return (
      <React.Fragment>
        <PageHead
          title="Accounts"
          enabled={this.props.overridePageHead}
          description="Summary view of the accounts configured for Embark" />
        <Accounts accounts={this.currentAccounts}
                  numberOfPages={this.numberOfPages}
                  changePage={(newPage) => this.changePage(newPage)}
                  currentPage={this.state.currentPage} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    accounts: getAccounts(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

AccountsContainer.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  fetchAccounts: PropTypes.func,
  numAccountsToDisplay: PropTypes.number,
  initBlockHeader: PropTypes.func,
  stopBlockHeader: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
  overridePageHead: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchAccounts: accountsAction.request,
    initBlockHeader,
    stopBlockHeader
  },
)(AccountsContainer);
