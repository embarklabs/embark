import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {blocks as blocksAction, initBlockHeader, stopBlockHeader} from '../actions';
import Blocks from '../components/Blocks';
import DataWrapper from "../components/DataWrapper";
import PageHead from "../components/PageHead";
import {getBlocks} from "../reducers/selectors";

const MAX_BLOCKS = 10; // TODO use same constant as API

class BlocksContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {currentPage: 0};
    this.numberOfBlocks = 0;
    this.currentBlocks = [];
  }

  componentDidMount() {
    this.props.fetchBlocks();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  getNumberOfPages() {
    if (!this.numberOfBlocks) {
      let blocks = this.props.blocks;
      if (blocks.length === 0) {
        this.numberOfBlocks = 0;
      } else {
        this.numberOfBlocks = blocks[blocks.length - 1].number - 1;
      }
    }
    return Math.ceil(this.numberOfBlocks / MAX_BLOCKS);
  }

  changePage(newPage) {
    this.setState({currentPage: newPage});

    this.props.fetchBlocks((newPage * MAX_BLOCKS) + MAX_BLOCKS);
  }

  getCurrentBlocks() {
    const currentPage = this.state.currentPage || this.getNumberOfPages();
    return this.props.blocks.filter(block => block.number <= (currentPage * MAX_BLOCKS) + MAX_BLOCKS &&
      block.number > currentPage * MAX_BLOCKS);
  }

  render() {
    const newBlocks = this.getCurrentBlocks();
    if (newBlocks.length) {
      this.currentBlocks = newBlocks;
    }
    return (
      <React.Fragment>
        <PageHead title="Blocks" enabled={this.props.overridePageHead} description="Summary of the most recent blocks" />
        <DataWrapper shouldRender={this.currentBlocks.length > 0} {...this.props} render={() => (
          <Blocks blocks={this.currentBlocks} numberOfPages={this.getNumberOfPages()}
                  changePage={(newPage) => this.changePage(newPage)}
                  currentPage={this.state.currentPage || this.getNumberOfPages()} />
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
  loading: PropTypes.bool,
  overridePageHead: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchBlocks: blocksAction.request,
    initBlockHeader,
    stopBlockHeader
  },
)(BlocksContainer);
