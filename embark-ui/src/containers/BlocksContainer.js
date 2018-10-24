import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {blocks as blocksAction, initBlockHeader, stopBlockHeader} from '../actions';
import Blocks from '../components/Blocks';
import DataWrapper from "../components/DataWrapper";
import {getBlocks} from "../reducers/selectors";

const MAX_BLOCKS = 10; // TODO use same constant as API

class BlocksContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchBlocks();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  loadMore() {
    this.props.fetchBlocks(this.loadMoreFrom());
  }

  getNumberOfPages() {
    return Math.ceil(this.loadMoreFrom() / MAX_BLOCKS);
  }

  loadMoreFrom() {
    let blocks = this.props.blocks;
    if (blocks.length === 0) {
      return 0;
    }
    return blocks[blocks.length - 1].number - 1;
  }

  changePage(newPage) {
    this.setState({currentPage: newPage});
  }

  render() {
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.props.blocks.length > 0} {...this.props} render={({blocks}) => (
          <Blocks blocks={blocks} numberOfPages={this.getNumberOfPages()}
                  changePage={(newPage) => this.changePage(newPage)} currentPage={this.state.currentPage} />
        )} />
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
  initBlockHeader: PropTypes.func,
  stopBlockHeader: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchBlocks: blocksAction.request,
    initBlockHeader,
    stopBlockHeader
  },
)(BlocksContainer);
