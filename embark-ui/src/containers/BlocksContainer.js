import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {fetchBlocks} from '../actions';
import Blocks from '../components/Blocks';
import Loading from '../components/Loading';
import LoadMore from '../components/LoadMore';

class BlocksContainer extends Component {

  componentDidMount() {
    if (!this.props.blocks.data) {
      this.props.fetchBlocks();
    }
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
    fetchBlocks
  },
)(BlocksContainer);
