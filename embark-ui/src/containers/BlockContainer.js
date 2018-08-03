import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {fetchBlock} from '../actions';
import Block from '../components/Block';
import Transactions from '../components/Transactions';
import Loading from '../components/Loading';

class BlockContainer extends Component {
  componentDidMount() {
    this.props.fetchBlock(this.props.router.match.params.blockNumber);
  }

  render() {
    const {block} = this.props;
    if (!block.data) {
      return <Loading />;
    }

    if (block.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      );
    }

    return (
      <React.Fragment>
        <Block blocks={block.data} />
        <Transactions transactions={block.data.transactions} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {block: state.block};
}

BlockContainer.propTypes = {
  router: PropTypes.object,
  block: PropTypes.object,
  fetchBlock: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchBlock
  }
))(BlockContainer);
