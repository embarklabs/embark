import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  contracts as contractsAction, 
  web3Deploy as web3DeployAction, 
  web3EstimateGas as web3EstimateGasAction,
  updateDeploymentPipeline} from "../actions";

import ContractsDeployment from '../components/ContractsDeployment';
import DataWrapper from "../components/DataWrapper";
import {getContracts, getDeploymentPipeline, getWeb3, getWeb3GasEstimates, getWeb3Deployments} from "../reducers/selectors";

class DeploymentContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contracts.length > 0} {...this.props} render={() => (
        <ContractsDeployment contracts={this.props.contracts} 
                             deploymentPipeline={this.props.deploymentPipeline} 
                             web3={this.props.web3}
                             web3Deploy={this.props.web3Deploy}
                             web3EstimateGas={this.props.web3EstimateGas}
                             web3Deployments={this.props.web3Deployments}
                             web3GasEstimates={this.props.web3GasEstimates}
                             updateDeploymentPipeline={this.props.updateDeploymentPipeline} />
      )} />
    );
  }
}

function mapStateToProps(state) {
  return {
    contracts: getContracts(state),
    deploymentPipeline: getDeploymentPipeline(state),
    web3: getWeb3(state),
    web3Deployments: getWeb3Deployments(state),
    web3GasEstimates: getWeb3GasEstimates(state),
    error: state.errorMessage, 
    loading: state.loading
  };
}

DeploymentContainer.propTypes = {
  web3: PropTypes.object,
  web3Deployments: PropTypes.object,
  web3GasEstimates: PropTypes.object,
  contracts: PropTypes.array,
  fetchContracts: PropTypes.func,
  web3Deploy: PropTypes.func,
  web3EstimateGas: PropTypes.func,
};

export default connect(
  mapStateToProps, {
    fetchContracts: contractsAction.request,
    web3Deploy: web3DeployAction.request,
    web3EstimateGas: web3EstimateGasAction.request,
    updateDeploymentPipeline: updateDeploymentPipeline
  }
)(DeploymentContainer);
