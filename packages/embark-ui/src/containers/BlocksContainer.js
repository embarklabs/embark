import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {blocks as blocksAction,
        initBlockHeader,
        stopBlockHeader} from '../actions';
import Blocks from '../components/Blocks';
import DataWrapper from "../components/DataWrapper";
import PageHead from "../components/PageHead";
import {getBlocks} from "../reducers/selectors";

const MAX_BLOCKS = 10; // TODO use same constant as API

class BlocksContainer extends Component {
  constructor(props) {
    super(props);

    this.numBlocksToDisplay = this.props.numBlocksToDisplay || MAX_BLOCKS;
    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchBlocks();
    this.props.initBlockHeader();
  }

  componentWillUnmount() {
    this.props.stopBlockHeader();
  }

  get numberOfBlocks() {
    const blocks = this.props.blocks;
    return !blocks.length ? 0 : blocks[0].number + 1;
  }

  getNumberOfPages() {
    return Math.ceil(this.numberOfBlocks / this.numBlocksToDisplay);
  }

  changePage(newPage) {
    this.setState({currentPage: newPage});
    this.props.fetchBlocks(
      this.numberOfBlocks - 1 - (this.numBlocksToDisplay * (newPage - 1))
    );
  }

  getCurrentBlocks() {
    return this.props.blocks
      .filter(block => {
        const index = (
          (this.numberOfBlocks -
           (this.numBlocksToDisplay * (this.state.currentPage - 1))) -
            block.number
        );
        return index <= this.numBlocksToDisplay && index > 0;
      });
  }

  render() {
    const newBlocks = this.getCurrentBlocks();
    return (
      <React.Fragment>
        <PageHead
          title="Blocks"
          enabled={this.props.overridePageHead}
          description="Summary of the most recent blocks" />
        <DataWrapper
          shouldRender={true}
          {...this.props}
          render={() => (
            <Blocks blocks={newBlocks}
                    numberOfPages={this.getNumberOfPages()}
                    changePage={(newPage) => this.changePage(newPage)}
                    currentPage={this.state.currentPage} />
          )} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    blocks: getBlocks(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

BlocksContainer.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object),
  fetchBlocks: PropTypes.func,
  initBlockHeader: PropTypes.func,
  numBlocksToDisplay: PropTypes.number,
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
