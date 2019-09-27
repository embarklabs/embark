import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {contractFunction as contractFunctionAction} from '../actions';
import ContractOverview from '../components/ContractOverview';
import DataWrapper from "../components/DataWrapper";
import {getContractFunctions} from "../reducers/selectors";

class ContractOverviewContainer extends Component {
  render() {
    return (
      <DataWrapper shouldRender={this.props.contractFunctions !== undefined}
                   {...this.props}
                   render={({contractFunctions, postContractFunction}) => (
                     <ContractOverview contractFunctions={contractFunctions}
                                       contract={this.props.contract}
                                       postContractFunction={postContractFunction}/>
                   )}/>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractFunctions: getContractFunctions(state, props.contract.className),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractOverviewContainer.propTypes = {
  contract: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func,
  error: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    postContractFunction: contractFunctionAction.post
  }
)(ContractOverviewContainer);
