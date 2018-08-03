import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { fetchContractProfile } from '../actions';
import ContractProfile from '../components/ContractProfile';
import { withRouter } from 'react-router'

class ContractProfileContainer extends Component {
  componentWillMount() {
    this.props.fetchContractProfile(this.props.match.params.contractName);
  }

  render() {
    console.dir("||======>");
    console.dir(this.props);
    console.dir("||======>");
    //const { contract } = this.props;
    const contract = this.props.contractProfile;
    if (!contract.data) {
      return (
        <h1>
          <i>Loading contract...</i>
        </h1>
      )
    }

    if (contract.data.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      )
    }

    console.dir(contract);

    return (
      <ContractProfile contract={contract.data} />
    );
  }
};

function mapStateToProps(state) {
  console.dir("-----------");
  console.dir("-----------");
  console.dir(state);
  console.dir("-----------");
  console.dir("-----------");
  return { contractProfile: state.contractProfile }
}

export default compose(
  connect(
    mapStateToProps,
    { fetchContractProfile }
  ),
  withRouter
)(ContractProfileContainer)

