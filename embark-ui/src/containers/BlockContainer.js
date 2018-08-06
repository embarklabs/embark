import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {fetchBlock} from '../actions';
import Block from '../components/Block';
import NoMatch from "../components/NoMatch";
import Transactions from '../components/Transactions';

class BlockContainer extends Component {
  componentDidMount() {
    this.props.fetchBlock(this.props.match.params.blockNumber);
  }

  render() {
    const {block} = this.props;
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
  if(state.blocks.data) {
    return {block: state.blocks.data.find(block => block.number.toString() === props.match.params.blockNumber)};
  }
  return {};
}

BlockContainer.propTypes = {
  match: PropTypes.object,
  block: PropTypes.object,
  fetchBlock: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchBlock
  }
)(BlockContainer));
