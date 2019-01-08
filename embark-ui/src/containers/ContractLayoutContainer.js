import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import {contract as contractAction} from '../actions';
import ContractLayout from '../components/ContractLayout';
import PageHead from '../components/PageHead';
import {getContract} from "../reducers/selectors";

class ContractLayoutContainer extends Component {
  componentDidMount() {
    this.props.fetchContract(this.props.match.params.contractName);
  }

  render() {
    if (this.props.contract){
      return (
        <React.Fragment>
          <PageHead title={this.props.match.params.contractName} description={`Interact with, view details of, and see all transactions for the ${this.props.match.params.contractName} contract`} />
          <ContractLayout contract={this.props.contract}/>
        </React.Fragment>
      );
    } else {
      return <React.Fragment />;
    }
  }
}

function mapStateToProps(state, props) {
  return {
    contract: getContract(state, props.match.params.contractName),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractLayoutContainer.propTypes = {
  match: PropTypes.object,
  contract: PropTypes.object,
  fetchContract: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchContract: contractAction.request
  }
)(ContractLayoutContainer));
