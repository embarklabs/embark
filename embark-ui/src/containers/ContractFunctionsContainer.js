import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {
  contractProfile as contractProfileAction,
  contractFunction as contractFunctionAction,
  ethGas as ethGasAction
} from '../actions';
import ContractFunctions from '../components/ContractFunctions';
import DataWrapper from "../components/DataWrapper";
import GasStation from "../components/GasStation";
import {getContractProfile, getContractFunctions, getGasStats} from "../reducers/selectors";

class ContractFunctionsContainer extends Component {
  componentDidMount() {
    this.props.fetchContractProfile(this.props.match.params.contractName);
    this.props.fetchEthGas();
  }

  render() {
    return (
      <React.Fragment>
        <DataWrapper shouldRender={this.props.contractProfile !== undefined}
                     {...this.props}
                     render={({contractProfile, contractFunctions, postContractFunction}) => (
                       <ContractFunctions contractProfile={contractProfile}
                                          contractFunctions={contractFunctions}
                                          postContractFunction={postContractFunction}/>
                     )}/>

        <DataWrapper shouldRender={this.props.gasStats !== undefined}
                     {...this.props}
                     render={({gasStats}) => (
                       <GasStation gasStats={gasStats}/>
                     )}/>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contractProfile: getContractProfile(state, props.match.params.contractName),
    contractFunctions: getContractFunctions(state, props.match.params.contractName),
    gasStats: getGasStats(state),
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
  fetchEthGas: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContractProfile: contractProfileAction.request,
    postContractFunction: contractFunctionAction.post,
    fetchEthGas: ethGasAction.request
  }
)(ContractFunctionsContainer));
