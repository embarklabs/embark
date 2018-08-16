import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {contractProfile as contractProfileAction, contractFunction as contractFunctionAction} from '../actions';
import ContractFunctions from '../components/ContractFunctions';
import DataWrapper from "../components/DataWrapper";
import {getContractProfile, getContractFunctions} from "../reducers/selectors";

class ContractFunctionsContainer extends Component {
  componentDidMount() {
    this.props.fetchContractProfile(this.props.match.params.contractName);
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.contractProfile !== undefined }
                   {...this.props}
                   render={({contractProfile, contractFunctions, postContractFunction}) => (
        <ContractFunctions contractProfile={contractProfile}
                           contractFunctions={contractFunctions}
                           constructor={true}
                           postContractFunction={postContractFunction}/>
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractProfile: getContractProfile(state, props.match.params.contractName),
    contractFunctions: getContractFunctions(state, props.match.params.contractName),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractFunctionsContainer.propTypes = {
  match: PropTypes.object,
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func,
  fetchContractProfile: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContractProfile: contractProfileAction.request,
    postContractFunction: contractFunctionAction.post
  }
)(ContractFunctionsContainer));
