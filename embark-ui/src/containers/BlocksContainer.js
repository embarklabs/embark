import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {fetchBlocks} from '../actions';
import Blocks from '../components/Blocks';
import Loading from '../components/Loading';

class BlocksContainer extends Component {
  componentDidMount() {
    this.props.fetchBlocks();
  }

  render() {
    const {blocks} = this.props;
    if (!blocks.data) {
      return <Loading />;
    }

    if (blocks.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      );
    }

    return (
      <Blocks blocks={blocks.data} />
    );
  }
}

function mapStateToProps(state) {
  return {blocks: state.blocks};
}

BlocksContainer.propTypes = {
  blocks: PropTypes.object,
  fetchBlocks: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchBlocks
  },
)(BlocksContainer);
