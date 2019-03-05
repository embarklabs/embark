import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {contractEvents as contractEventsAction, contractLogs as contractLogsAction, listenToContractLogs, listenToContractEvents} from '../actions';

import ContractLog from '../components/ContractLog';
import DataWrapper from "../components/DataWrapper";
import {getContractLogsByContract, getContractEventsByContract} from "../reducers/selectors";

class ContractLogContainer extends Component {
  componentDidMount() {
    if (this.props.contractLogs.length === 0) {
      this.props.listenToContractLogs();
      this.props.fetchContractLogs();
    }

    if (this.props.contractEvents.length === 0) {
      this.props.listenToContractEvents();
      this.props.fetchContractEvents();
    }
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contractLogs !== undefined } {...this.props} render={() => (
        <ContractLog contractLogs={this.props.contractLogs}
                     contractEvents={this.props.contractEvents}
                     contract={this.props.contract}/>
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractLogs: getContractLogsByContract(state, props.contract.className),
    contractEvents: getContractEventsByContract(state, props.contract.className)
  };
}

ContractLogContainer.propTypes = {
  contract: PropTypes.object,
  contractLogs: PropTypes.array,
  contractEvents: PropTypes.array,
  fetchContractLogs: PropTypes.func,
  listenToContractLogs: PropTypes.func,
  fetchContractEvents: PropTypes.func,
  listenToContractEvents: PropTypes.func,
  match: PropTypes.object
};

export default connect(
  mapStateToProps,
  {
    fetchContractLogs: contractLogsAction.request,
    listenToContractLogs: listenToContractLogs,
    fetchContractEvents: contractEventsAction.request,
    listenToContractEvents: listenToContractEvents
  }
)(ContractLogContainer);
