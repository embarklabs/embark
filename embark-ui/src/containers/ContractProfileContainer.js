import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { fetchContractProfile } from '../actions';
import ContractProfile from '../components/ContractProfile';
import { withRouter } from 'react-router';

class ContractProfileContainer extends Component {
  componentWillMount() {
    this.props.fetchContractProfile(this.props.match.params.contractName);
  }

  render() {
    const { contractProfile } = this.props;
    if (!contractProfile.data) {
      return (
        <h1>
          <i>Loading contract profile...</i>
        </h1>
      );
    }

    if (contractProfile.data.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      );
    }

    return (
      <ContractProfile contract={contractProfile.data} />
    );
  }
}

function mapStateToProps(state) {
  return { contractProfile: state.contractProfile };
}

export default compose(
  connect(
    mapStateToProps,
    { fetchContractProfile }
  ),
  withRouter
)(ContractProfileContainer);

