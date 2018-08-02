import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { fetchContract } from '../actions';
import Contract from '../components/Contract';
import { withRouter } from 'react-router'

class ContractContainer extends Component {
  componentWillMount() {
    console.dir("----");
    console.dir(this.props);
    //console.dir(this.state);
    //console.dir(this.props.match.params.contractName);
    //console.dir(this.props.match.params.contractName);
    //console.dir(this.props.fetchContract.toString());
    this.props.fetchContract(this.props.match.params.contractName);
  }

  render() {
    console.dir("||======>");
    console.dir(this.props);
    console.dir("||======>");
    const { contract } = this.props;
    if (!contract.data) {
      return (
        <h1>
          <i>Loading contract...</i>
        </h1>
      )
    }

    if (contract.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      )
    }

    console.dir(contract);

    return (
      <Contract contract={contract.data} />
    );
  }
};

function mapStateToProps(state) {
  console.dir("---->>>>>");
  console.dir(arguments);
  return { contract: state.contract }
}

export default compose(
  connect(
    mapStateToProps,
    { fetchContract }
  ),
  withRouter
)(ContractContainer)

