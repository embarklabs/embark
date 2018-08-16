import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';

import Contract from '../components/Contract';
import DataWrapper from "../components/DataWrapper";
import {getContract} from "../reducers/selectors";

class ContractContainer extends Component {
  render() {
    return (
      <DataWrapper shouldRender={this.props.contract !== undefined } {...this.props} render={({contract}) => (
        <Contract contract={contract} />
      )} />
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contract: getContract(state, props.match.params.contractName),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractContainer.propTypes = {
  match: PropTypes.object,
  contract: PropTypes.object,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps
)(ContractContainer));
