import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {blocks as blocksAction} from '../actions';
import Blocks from '../components/Blocks';
import DataWrapper from "../components/DataWrapper";
import LoadMore from "../components/LoadMore";
import {getBlocks} from "../reducers/selectors";

class BlocksContainer extends Component {
  componentDidMount() {
    this.props.fetchBlocks();
  }

  loadMore() {
    this.props.fetchBlocks(this.loadMoreFrom());
  }

  loadMoreFrom() {
    let blocks = this.props.blocks;
    if (blocks.length === 0) {
      return 0;
    }
    return blocks[blocks.length - 1].number - 1;
  }

  render() {
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.props.blocks.length > 0} {...this.props} render={({blocks}) => (
          <Blocks blocks={blocks} />
        )} />
        {(this.loadMoreFrom() >= 0) ? <LoadMore loadMore={() => this.loadMore()} /> : <React.Fragment />}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {blocks: getBlocks(state), error: state.errorMessage, loading: state.loading};
}

BlocksContainer.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object),
  fetchBlocks: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchBlocks: blocksAction.request
  },
)(BlocksContainer);
