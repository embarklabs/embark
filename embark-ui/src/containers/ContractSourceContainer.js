import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {Page} from "tabler-react";

import {contractFile as contractFileAction} from '../actions';
import DataWrapper from "../components/DataWrapper";
import Fiddle from "../components/Fiddle";
import {getContract, getContractFile} from "../reducers/selectors";

class ContractSourceContainer extends Component {
  componentDidMount() {
    this.props.fetchContractFile(this.props.contract.filename);
  }

  render() {
    return (
      <Page.Content title={`${this.props.contract.className} Source`}>
        <DataWrapper shouldRender={this.props.contractFile !== undefined } {...this.props} render={({contractFile}) => (
          <Fiddle value={contractFile.source} />
        )} />
      </Page.Content>
    );
  }
}

function mapStateToProps(state, props) {
  const contract = getContract(state, props.match.params.contractName);
  const contractFile = getContractFile(state, contract.filename);

  return {
    contract,
    contractFile,
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractSourceContainer.propTypes = {
  match: PropTypes.object,
  contract: PropTypes.object,
  contractFile: PropTypes.object,
  fetchContractFile: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContractFile: contractFileAction.request
  }
)(ContractSourceContainer));
