import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {contracts as contractsAction} from "../actions";

import ContractsDeployment from '../components/ContractsDeployment';
import DataWrapper from "../components/DataWrapper";
import {getContracts} from "../reducers/selectors";

class DeploymentContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contracts.length > 0} {...this.props} render={({contracts}) => (
        <ContractsDeployment contracts={contracts} />
      )} />
    );
  }
}

function mapStateToProps(state) {
  return {
    contracts: getContracts(state), 
    error: state.errorMessage, 
    loading: state.loading};
}

DeploymentContainer.propTypes = {
  contracts: PropTypes.array,
  fetchContracts: PropTypes.func
};

export default connect(
  mapStateToProps,{
    fetchContracts: contractsAction.request
  }
)(DeploymentContainer);
