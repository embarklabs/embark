import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import GasStation from '../components/GasStation';
import {stopGasOracle, listenToGasOracle, gasOracle as ethGasAction, blocks as blocksAction} from "../actions";
import DataWrapper from "../components/DataWrapper";
import {getOracleGasStats, getLastBlock} from "../reducers/selectors";
import {Alert} from 'reactstrap';

class GasStationContainer extends Component {
  componentDidMount() {
    this.props.fetchEthGas();
    this.props.listenToGasOracle();
    this.props.fetchBlocks();
  }

  componentWillUnmount() {
    this.props.stopGasOracle();
  }

  getCurrentGas() {
    if (!this.gasStation) {
      return -1;
    }
    return this.gasStation.getCurrentGas();
  }

  render() {
    return <DataWrapper shouldRender={Boolean(this.props.gasOracleStats && Object.keys(this.props.gasOracleStats).length && this.props.lastBlock)}
                        {...this.props} render={({lastBlock, gasOracleStats}) => (
      <GasStation gasOracleStats={gasOracleStats} lastBlock={lastBlock} ref={instance => { this.gasStation = instance; }}/>
    )} elseRender={() => {
      return (<Alert color="danger">No blocks detected. If you are connected using an RPC connection, switch to WS to have access to new block events. If you are in development, add new blocks by making transactions.</Alert>)
    }}/>;

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

export default connect(
  mapStateToProps,
  {
    fetchEthGas: ethGasAction.request,
    fetchBlocks: blocksAction.request,
    listenToGasOracle,
    stopGasOracle
  },
  null,
  { withRef: true }
)(GasStationContainer);
