import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import Contracts from '../components/Contracts';
import DataWrapper from "../components/DataWrapper";
import {getContracts} from "../reducers/selectors";

class ContractsContainer extends Component {
  render() {
    return (
      <DataWrapper shouldRender={this.props.contracts.length > 0} {...this.props} render={({contracts}) => (
        <Contracts contracts={contracts} />
      )} />
    );
  }
}

function mapStateToProps(state) {
  return {contracts: getContracts(state), error: state.errorMessage, loading: state.loading};
}

ContractsContainer.propTypes = {
  contracts: PropTypes.array
};

export default connect(
  mapStateToProps
)(ContractsContainer);
