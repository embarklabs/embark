import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";
import GasStation from '../components/GasStation';
import {stopGasOracle, listenToGasOracle, gasOracle as ethGasAction, blocks as blocksAction} from "../actions";
import DataWrapper from "../components/DataWrapper";
import {getOracleGasStats, getLastBlock} from "../reducers/selectors";

class GasStationContainer extends Component {
  componentDidMount() {
    this.props.fetchEthGas();
    this.props.listenToGasOracle();
    this.props.fetchBlocks();
  }

  componentWillUnmount() {
    this.props.stopGasOracle();
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
  stopGasOracle: PropTypes.func,
  fetchBlocks: PropTypes.func,
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
    fetchEthGas: ethGasAction.request,
    fetchBlocks: blocksAction.request,
    listenToGasOracle,
    stopGasOracle
  }
)(GasStationContainer));
