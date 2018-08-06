import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {block as blockAction} from '../actions';
import Block from '../components/Block';
import Error from "../components/Error";
import NoMatch from "../components/NoMatch";
import Transactions from '../components/Transactions';

class BlockContainer extends Component {
  componentDidMount() {
    this.props.fetchBlock(this.props.match.params.blockNumber);
  }

  render() {
    const {block, error} = this.props;
    if (error) {
      return <Error error={error} />;
    }
    if (!block) {
      return <NoMatch />;
    }

    return (
      <React.Fragment>
        <Block block={block} />
        <Transactions transactions={block.transactions} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  if(state.blocks.error) {
    return {error: state.blocks.error};
  }
  if(state.blocks.data) {
    return {block: state.blocks.data.find(block => block.number.toString() === props.match.params.blockNumber)};
  }
  return {};
}

BlockContainer.propTypes = {
  match: PropTypes.object,
  block: PropTypes.object,
  fetchBlock: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchBlock: blockAction.request
  }
)(BlockContainer));
