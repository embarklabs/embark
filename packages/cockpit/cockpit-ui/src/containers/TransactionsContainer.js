import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {blocksFull as blocksAction,
        contracts as contractsAction,
        initBlockHeader,
        stopBlockHeader,
        transactions as transactionsAction} from '../actions';
import Transactions from '../components/Transactions';
import PageHead from '../components/PageHead';
import {getBlocksFull, getContracts, getTransactions} from '../reducers/selectors';

const MAX_TXS = 10; // TODO use same constant as API

class TransactionsContainer extends Component {
  constructor(props) {
    super(props);

    this.numTxsToDisplay = this.props.numTxsToDisplay || MAX_TXS;
    this.numBlocksToFetch = this.numTxsToDisplay;
    this.resetNums();
    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchBlocksFull(null, this.numBlocksToFetch);
    this.props.fetchContracts();
    this.props.fetchTransactions();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  get numberOfBlocks() {
    if (this._numberOfBlocks === null) {
      const blocks = this.props.blocks;
      this._numberOfBlocks = !blocks.length ? 0 : blocks[0].number + 1;
    }
    return this._numberOfBlocks;
  }

  get estNumberOfTxs() {
    if (this._estNumberOfTxs !== null) {
      return this._estNumberOfTxs;
    }
    const blocks = this.props.blocks;
    const numBlocksInProps = blocks.length;
    const numTxsInPropsBlocks = blocks.reduce(
      (txCount, block) => txCount + block.transactions.length,
      0
    );
    const missingNumBlocks = this.numberOfBlocks - numBlocksInProps;
    this._estNumberOfTxs = missingNumBlocks + numTxsInPropsBlocks;
    return this._estNumberOfTxs;
  }

  get numberOfPages() {
    if (this._numberOfPages === null) {
      this._numberOfPages = Math.ceil(
        this.estNumberOfTxs / this.numTxsToDisplay
      );
    }
    return this._numberOfPages;
  }

  resetNums() {
    this._numberOfBlocks = null;
    this._estNumberOfTxs = null;
    this._numberOfPages = null;
  }

  changePage(newPage) {
    if (newPage <= 0) {
      newPage = 1;
    } else if (newPage > this.numberOfPages) {
      newPage = this.numberOfPages;
    }
    this.setState({ currentPage: newPage });
    const blockFrom =
      this.numberOfBlocks - 1 - this.numBlocksToFetch * (newPage - 1);
    this.props.fetchBlocksFull(blockFrom, this.numBlocksToFetch);
    this.props.fetchTransactions(blockFrom, this.numTxsToDisplay);
  }

  get currentTransactions() {
    if (!this.props.blocks.length) return [];
    let relativeBlock = this.numberOfBlocks - 1;
    let offset = 0;
    let txs = this.props.blocks.reduce((txs, block) => {
      offset = relativeBlock - block.number;
      if (offset <= 1) {
        offset = 0;
      }
      relativeBlock = block.number;
      const txsLength = txs.length;
      block.transactions.forEach((tx, idx) => {
        txs[txsLength + idx + offset] = tx;
      });
      return txs;
    }, []);
    const estNumberOfTxs = this.estNumberOfTxs;
    return txs.filter((tx, idx) => {
      const txNumber = estNumberOfTxs - idx;
      const index =
        estNumberOfTxs -
        this.numTxsToDisplay * (this.state.currentPage - 1) -
        txNumber + 1;
      return index <= this.numTxsToDisplay && index > 0;
    });
  }

  render() {
    this.resetNums();
    return (
      <React.Fragment>
        <PageHead
          title="Transactions"
          enabled={this.props.overridePageHead}
          description="Summary view of all transactions occurring on the node configured for Embark" />
        <Transactions
          transactions={this.currentTransactions}
          contracts={this.props.contracts}
          changePage={newPage => this.changePage(newPage)}
          currentPage={this.state.currentPage}
          numberOfPages={this.numberOfPages} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    blocks: getBlocksFull(state),
    contracts: getContracts(state),
    transactions: getTransactions(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

TransactionsContainer.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object),
  contracts: PropTypes.arrayOf(PropTypes.object),
  transactions: PropTypes.arrayOf(PropTypes.object),
  fetchBlocksFull: PropTypes.func,
  fetchContracts: PropTypes.func,
  fetchTransactions: PropTypes.func,
  numTxsToDisplay: PropTypes.number,
  initBlockHeader: PropTypes.func,
  stopBlockHeader: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
  overridePageHead: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchBlocksFull: blocksAction.request,
    fetchContracts: contractsAction.request,
    fetchTransactions: transactionsAction.request,
    initBlockHeader,
    stopBlockHeader
  }
)(TransactionsContainer);
