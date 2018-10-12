import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {contracts as contractsAction} from '../actions';
import ContractLayout from '../components/ContractLayout';
import {getContractsByPath} from "../reducers/selectors";

class FileContractsContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  render() {
    return (
      this.props.contracts.map(contract => <ContractLayout contract={contract} />)
    )
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByPath(state, props.currentFile.path),
    error: state.errorMessage,
    loading: state.loading
  };
}

FileContractsContainer.propTypes = {
  contracts: PropTypes.arrayOf(PropTypes.object),
  fetchContractsByPath: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchContracts: contractsAction.request
  }
)(FileContractsContainer);
