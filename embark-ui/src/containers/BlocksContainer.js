import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {blocks as blocksAction} from '../actions';
import Blocks from '../components/Blocks';
import Loading from '../components/Loading';
import LoadMore from '../components/LoadMore';
import Error from '../components/Error';

class BlocksContainer extends Component {
  componentDidMount() {
    this.props.fetchBlocks();
  }

  loadMore() {
    this.props.fetchBlocks(this.loadMoreFrom());
  }

  loadMoreFrom() {
    let blocks = this.props.blocks.data;
    return blocks[blocks.length - 1].number - 1;
  }

  render() {
    const {blocks} = this.props;
    if (blocks.error) {
      return <Error error={blocks.error} />;
    }

    if (!blocks.data) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <Blocks blocks={blocks.data}/>
        {(this.loadMoreFrom() >= 0) ? <LoadMore loadMore={() => this.loadMore()} /> : <React.Fragment />}
      </React.Fragment>
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
    fetchBlocks: blocksAction.request
  },
)(BlocksContainer);
