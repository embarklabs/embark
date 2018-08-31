import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {contractProfile as contractProfileAction, contractDeploy as contractDeployAction} from '../actions';
import ContractFunctions from '../components/ContractFunctions';
import DataWrapper from "../components/DataWrapper";
import GasStation from "../components/GasStation";
import {getContractProfile, getContractDeploys} from "../reducers/selectors";

class ContractDeploymentContainer extends Component {
  componentDidMount() {
    this.props.fetchContractProfile(this.props.match.params.contractName);
  }

  render() {
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.props.contractProfile !== undefined}
                     {...this.props}
                     render={({contractProfile, contractDeploys, postContractDeploy}) => (
                       <ContractFunctions contractProfile={contractProfile}
                                          contractFunctions={contractDeploys}
                                          onlyConstructor
                                          postContractFunction={postContractDeploy}/>
                     )}/>
        <GasStation/>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractProfile: getContractProfile(state, props.match.params.contractName),
    contractDeploys: getContractDeploys(state, props.match.params.contractName),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractDeploymentContainer.propTypes = {
  match: PropTypes.object,
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractDeploy: PropTypes.func,
  fetchContractProfile: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContractProfile: contractProfileAction.request,
    postContractDeploy: contractDeployAction.post
  }
)(ContractDeploymentContainer));
