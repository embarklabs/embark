import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchContracts } from '../actions';
import Contracts from '../components/Contracts';

class ContractsContainer extends Component {
  componentWillMount() {
    this.props.fetchContracts();
  }

  render() {
    const { contracts } = this.props;
    if (!contracts.data) {
      return (
        <h1>
          <i>Loading contracts...</i>
        </h1>
      )
    }

    if (contracts.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      )
    }

    return (
      <Contracts contracts={contracts.data} />
    );
  }
};

function mapStateToProps(state) {
  return { contracts: state.contracts }
}

export default connect(
  mapStateToProps,
  {
    fetchContracts
  },
)(ContractsContainer)

