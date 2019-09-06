import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  startDebug,
  stopDebug,
  debugJumpBack,
  debugJumpForward,
  debugStepOverForward,
  debugStepOverBackward,
  debugStepIntoForward,
  debugStepIntoBackward
} from '../actions';
import ContractDebugger from '../components/ContractDebugger';
import {getDebuggerInfo} from "../reducers/selectors";

class ContractDebuggerContainer extends Component {
  render() {
    return (
      <ContractDebugger debuggerTransactionHash={this.props.debuggerTransactionHash}
                        startDebug={this.props.startDebug}
                        stopDebug={this.props.stopDebug}
                        debugJumpBack={this.props.debugJumpBack}
                        debugJumpForward={this.props.debugJumpForward}
                        debugStepOverForward={this.props.debugStepOverForward}
                        debugStepOverBackward={this.props.debugStepOverBackward}
                        debugStepIntoForward={this.props.debugStepIntoForward}
                        debugStepIntoBackward={this.props.debugStepIntoBackward}
                        debuggerInfo={this.props.debuggerInfo}/>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    debuggerInfo: getDebuggerInfo(state)
  };
}

ContractDebuggerContainer.propTypes = {
  debuggerTransactionHash: PropTypes.string,
  startDebug: PropTypes.func,
  stopDebug: PropTypes.func,
  debugJumpBack: PropTypes.func,
  debugJumpForward: PropTypes.func,
  debugStepOverBackward: PropTypes.func,
  debugStepIntoForward: PropTypes.func,
  debugStepIntoBackward: PropTypes.func,
  debugStepOverForward: PropTypes.func,
  debuggerInfo: PropTypes.object
};

export default connect(
  mapStateToProps,
  {
    startDebug: startDebug.request,
    stopDebug: stopDebug.request,
    debugJumpBack: debugJumpBack.request,
    debugJumpForward: debugJumpForward.request,
    debugStepOverForward: debugStepOverForward.request,
    debugStepOverBackward: debugStepOverBackward.request,
    debugStepIntoForward: debugStepIntoForward.request,
    debugStepIntoBackward: debugStepIntoBackward.request
  }
)(ContractDebuggerContainer);

