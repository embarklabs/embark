import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {contract as contractAction} from '../actions';
import ContractLayout from '../components/ContractLayout';
import {getContractsByPath} from "../reducers/selectors";

class FileContractsContainer extends Component {
  componentDidMount() {
    this.props.fetchContract(this.props.currentFile);
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
  fetchFileContracts: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchContract: contractAction.request
  }
)(FileContractsContainer);
