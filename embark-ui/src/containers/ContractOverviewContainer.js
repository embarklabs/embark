import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {contractProfile as contractProfileAction, contractFunction as contractFunctionAction} from '../actions';
import ContractOverview from '../components/ContractOverview';
import DataWrapper from "../components/DataWrapper";
import {getContractProfile, getContractFunctions} from "../reducers/selectors";

class ContractOverviewContainer extends Component {
  componentDidMount() {
    this.props.fetchContractProfile(this.props.contract.className);
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contractProfile !== undefined}
                   {...this.props}
                   render={({contractProfile, contractFunctions, postContractFunction}) => (
                     <ContractOverview contractProfile={contractProfile}
                                       contractFunctions={contractFunctions}
                                       contract={this.props.contract}
                                       postContractFunction={postContractFunction}/>
                   )}/>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractProfile: getContractProfile(state, props.contract.className),
    contractFunctions: getContractFunctions(state, props.contract.className),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractOverviewContainer.propTypes = {
  contract: PropTypes.object,
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func,
  fetchContractProfile: PropTypes.func,
  error: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    fetchContractProfile: contractProfileAction.request,
    postContractFunction: contractFunctionAction.post
  }
)(ContractOverviewContainer);
