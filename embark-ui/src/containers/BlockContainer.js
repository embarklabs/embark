import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {block as blockAction} from '../actions';
import Block from '../components/Block';
import DataWrapper from "../components/DataWrapper";
import Transactions from '../components/Transactions';
import PageHead from '../components/PageHead';
import {getBlock, getTransactionsByBlock} from "../reducers/selectors";

class BlockContainer extends Component {
  componentDidMount() {
    this.props.fetchBlock(this.props.match.params.blockNumber);
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title={`Block ${this.props.match.params.blockNumber}`} description={`Details of block ${this.props.match.params.blockNumber}`} />
        <DataWrapper shouldRender={this.props.block !== undefined } {...this.props} render={({block, transactions}) => (
          <React.Fragment>
            <Block block={block} />
            <Transactions transactions={transactions || []} />
          </React.Fragment>
        )} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    block: getBlock(state, props.match.params.blockNumber),
    transactions: getTransactionsByBlock(state, props.match.params.blockNumber),
    error: state.errorMessage,
    loading: state.loading
  };
}

BlockContainer.propTypes = {
  match: PropTypes.object,
  block: PropTypes.object,
  transactions: PropTypes.arrayOf(PropTypes.object),
  fetchBlock: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchBlock: blockAction.request
  }
)(BlockContainer));
