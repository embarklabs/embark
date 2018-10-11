import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {contract as contractAction} from '../actions';
import ContractLayout from '../components/ContractLayout';
import {getContractsByFilename} from "../reducers/selectors";

class FileContractsContainer extends Component {
  componentDidMount() {
    this.props.fetchContract(this.props.currentFile);
  }

  render() {
    if (this.props.contract){
      return <ContractLayout contractIsFiddle={this.props.contract.isFiddle} />;
    } else {
      return <React.Fragment />;
    }
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByFilename(state, props.currentFile.name),
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
