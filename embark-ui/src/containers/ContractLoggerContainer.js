import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {contractLogs as contractLogsAction, listenToContractLogs} from '../actions';

import ContractLogger from '../components/ContractLogger';
import DataWrapper from "../components/DataWrapper";
import {getContractLogsByContract} from "../reducers/selectors";

class ContractLoggerContainer extends Component {
  componentDidMount() {
    if (this.props.contractLogs.length === 0) {
      this.props.listenToContractLogs();
      this.props.fetchContractLogs(this.props.match.params.contractName);
    }
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contractLogs !== undefined } {...this.props} render={() => (
        <ContractLogger contractLogs={this.props.contractLogs} contractName={this.props.match.params.contractName}/>
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractLogs: getContractLogsByContract(state, props.match.params.contractName)
  };
}

ContractLoggerContainer.propTypes = {
  contractLogs: PropTypes.array,
  fetchContractLogs: PropTypes.func,
  listenToContractLogs: PropTypes.func,
  match: PropTypes.object
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContractLogs: contractLogsAction.request,
    listenToContractLogs: listenToContractLogs
  }
)(ContractLoggerContainer));
