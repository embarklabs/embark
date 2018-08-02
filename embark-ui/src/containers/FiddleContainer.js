import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchAccounts } from '../actions';
import Fiddle from '../components/Fiddle';

class FiddleContainer extends Component {
  componentWillMount() {
    this.props.fetchAccounts();
  }

  render() {
    const { accounts } = this.props;
    if (!accounts.data) {
      return (
        <h1>
          <i>Loading accounts...</i>
        </h1>
      )
    }

    if (accounts.error) {
      return (
        <h1>
          <i>Error API...</i>
        </h1>
      )
    }

    return (
      <Fiddle />
    );
  }
};

function mapStateToProps(state) {
  return { accounts: state.accounts }
}

export default connect(
  mapStateToProps,
  {
    fetchAccounts
  },
)(FiddleContainer)
