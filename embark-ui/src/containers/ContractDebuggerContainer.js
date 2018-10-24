import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {startDebug, debugJumpBack, debugJumpForward, debugStepOverForward, debugStepOverBackward, debugStepIntoForward, debugStepIntoBackward} from '../actions';

import ContractDebugger from '../components/ContractDebugger';
import DataWrapper from "../components/DataWrapper";
import {getContractLogsByContract, debuggerInfo} from "../reducers/selectors";

class ContractDebuggerContainer extends Component {
  render() {
    return (
      <DataWrapper shouldRender={this.props.contractLogs !== undefined } {...this.props} render={() => (
        <ContractDebugger contract={this.props.contract} startDebug={this.props.startDebug}
                          debugJumpBack={this.props.debugJumpBack} debugJumpForward={this.props.debugJumpForward}
                          debugStepOverForward={this.props.debugStepOverForward}
                          debugStepOverBackward={this.props.debugStepOverBackward}
                          debugStepIntoForward={this.props.debugStepIntoForward}
                          debugStepIntoBackward={this.props.debugStepIntoBackward}
                          debuggerInfo={this.props.debuggerInfo}
        />
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractLogs: getContractLogsByContract(state, props.contract.className),
    debuggerInfo: debuggerInfo(state)
  };
}

ContractDebuggerContainer.propTypes = {
  contractLogs: PropTypes.array,
  fetchContractLogs: PropTypes.func,
  listenToContractLogs: PropTypes.func,
  match: PropTypes.object,
  contract: PropTypes.object,
  startDebug: PropTypes.func,
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
    debugJumpBack: debugJumpBack.request,
    debugJumpForward: debugJumpForward.request,
    debugStepOverForward: debugStepOverForward.request,
    debugStepOverBackward: debugStepOverBackward.request,
    debugStepIntoForward: debugStepIntoForward.request,
    debugStepIntoBackward: debugStepIntoBackward.request
  }
)(ContractDebuggerContainer);

