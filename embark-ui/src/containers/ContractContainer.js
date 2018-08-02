import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchContract } from '../actions';
import Contract from '../components/Contract';

class ContractContainer extends Component {
  componentWillMount() {
    console.dir("----");
    console.dir(this.props);
    console.dir(this.state);
    this.props.fetchContract(this.props.contractName);
  }

  render() {
    //const { contract } = this.props;
    //if (!contracts.data) {
    //  return (
    //    <h1>
    //      <i>Loading contracts...</i>
    //    </h1>
    //  )
    //}

    //if (contracts.error) {
    //  return (
    //    <h1>
    //      <i>Error API...</i>
    //    </h1>
    //  )
    //}

    return (
      //<Contract contract={contract} />
      <div>hello</div>
    );
  }
};

function mapStateToProps(state) {
  console.dir("---->>>>>");
  console.dir(arguments);
  return { contract: state.contract }
}

export default connect(
  mapStateToProps,
  {
    fetchContract
  },
)(ContractContainer)

