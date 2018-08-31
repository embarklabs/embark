import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";
import GasStation from '../components/GasStation';
import {listenToGasOracle, gasOracle as ethGasAction, blocks as blocksAction} from "../actions";
import DataWrapper from "../components/DataWrapper";
import {getOracleGasStats, getLastBlock} from "../reducers/selectors";

class GasStationContainer extends Component {
  componentDidMount() {
    this.props.fetchEthGas();
    if (!this.props.gasOracleStats.length) {
      this.props.listenToGasOracle();
    }
    if (!this.props.lastBlock) {
      this.props.fetchBlocks();
    }
  }

  render() {
    return <DataWrapper shouldRender={this.props.gasOracleStats && Object.keys(this.props.gasOracleStats).length && this.props.lastBlock}
                        {...this.props} render={({lastBlock, gasOracleStats}) => (
      <GasStation gasOracleStats={gasOracleStats} lastBlock={lastBlock}/>
    )}/>;

  }
}

GasStationContainer.propTypes = {
  gasOracleStats: PropTypes.object,
  lastBlock: PropTypes.object,
  listenToGasOracle: PropTypes.func,
  fetchEthGas: PropTypes.func
};

function mapStateToProps(state, _props) {
  return {
    gasOracleStats: getOracleGasStats(state),
    lastBlock: getLastBlock(state)
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    listenToGasOracle: listenToGasOracle,
    fetchEthGas: ethGasAction.request,
    fetchBlocks: blocksAction.request
  }
)(GasStationContainer));
