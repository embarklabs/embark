import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {contracts as contractsAction,
        listenToContracts,
        stopContracts,
        web3Deploy as web3DeployAction,
        web3EstimateGas as web3EstimateGasAction,
        updateDeploymentPipeline} from "../actions";
import ContractsDeployment from '../components/ContractsDeployment';
import {getContracts,
        getDeploymentPipeline,
        getWeb3,
        getWeb3GasEstimates,
        getWeb3Deployments,
        getWeb3ContractsDeployed} from "../reducers/selectors";
import PageHead from '../components/PageHead';

const MAX_CONTRACTS = 10;

class DeploymentContainer extends Component {
  constructor(props) {
    super(props);

    this.numContractsToDisplay = this.props.numContractsToDisplay || MAX_CONTRACTS;
    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchContracts();
    this.props.listenToContracts();
  }

  componentWillUnmount() {
    this.props.stopContracts();
  }

  get numberOfContracts() {
    if (this._numberOfContracts === undefined) {
      this._numberOfContracts = this.props.contracts
        .filter(contract => (contract.code || contract.deploy) && !contract.silent)
        .length;
    }
    return this._numberOfContracts;
  }

  get numberOfPages() {
    if (this._numberOfPages === undefined) {
      this._numberOfPages = Math.ceil(
        this.numberOfContracts / this.numContractsToDisplay
      );
    }
    return this._numberOfPages;
  }

  resetNums() {
    this._numberOfContracts = undefined;
    this._numberOfPages = undefined;
  }

  changePage(newPage) {
    if (newPage <= 0) {
      newPage = 1;
    } else if (newPage > this.numberOfPages) {
      newPage = this.numberOfPages;
    }
    this.setState({ currentPage: newPage });
    this.props.fetchContracts();
  }

  get currentContracts() {
    let offset = 0;
    return this.props.contracts
      .filter((contract, arrIndex) => {
        if (!(contract.code || contract.deploy) || contract.silent) {
          offset++;
          return false
        };
        const index = (
          (arrIndex + 1 - offset) -
            (this.numContractsToDisplay * (this.state.currentPage - 1))
        );
        return index <= this.numContractsToDisplay && index > 0;
      });
  }

  render() {
    this.resetNums();
    return (
      <React.Fragment>
        <PageHead title="Deployment"
                  description="Deploy your contracts using Embark or a web3-enabled browser such as Mist or MetaMask." />
        <ContractsDeployment contracts={this.currentContracts}
                             deploymentPipeline={this.props.deploymentPipeline}
                             web3={this.props.web3}
                             web3Deploy={this.props.web3Deploy}
                             web3EstimateGas={this.props.web3EstimateGas}
                             web3Deployments={this.props.web3Deployments}
                             web3GasEstimates={this.props.web3GasEstimates}
                             web3ContractsDeployed={this.props.web3ContractsDeployed}
                             updateDeploymentPipeline={this.props.updateDeploymentPipeline}
                             numberOfPages={this.numberOfPages}
                             changePage={(newPage) => this.changePage(newPage)}
                             currentPage={this.state.currentPage} />
      </React.Fragment>
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
    web3ContractsDeployed: getWeb3ContractsDeployed(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

DeploymentContainer.propTypes = {
  contracts: PropTypes.array,
  fetchContracts: PropTypes.func,
  numContractsToDisplay: PropTypes.number,
  listenToContracts: PropTypes.func,
  stopContracts: PropTypes.func,
  deploymentPipeline:  PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  updateDeploymentPipeline: PropTypes.func,
  web3: PropTypes.object,
  web3Deploy: PropTypes.func,
  web3Deployments: PropTypes.object,
  web3EstimateGas: PropTypes.func,
  web3GasEstimates: PropTypes.object,
  web3ContractsDeployed: PropTypes.object
};

export default connect(
  mapStateToProps, {
    fetchContracts: contractsAction.request,
    listenToContracts,
    stopContracts,
    web3Deploy: web3DeployAction.request,
    web3EstimateGas: web3EstimateGasAction.request,
    updateDeploymentPipeline: updateDeploymentPipeline
  }
)(DeploymentContainer);
