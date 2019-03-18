import React from 'react';
import PropTypes from 'prop-types';
import {Button} from "reactstrap";
import FontAwesome from 'react-fontawesome';
import {withRouter} from "react-router-dom";

class DebugButton extends React.Component {
  onClick() {
    this.props.history.push(`/editor?debuggerTransactionHash=${this.props.transaction.hash}`);
    this.props.onClick();
  }

  isDebuggable() {
    return this.props.forceDebuggable ||
      (!this.props.transaction.isCall &&
       !this.props.transaction.isConstructor &&
       this.props.contracts &&
       this.props.contracts.find(contract => {
         const address = this.props.transaction.to || this.props.transaction.address;
         return !contract.silent &&
           contract.deployedAddress &&
           address &&
           (contract.deployedAddress.toLowerCase() === address.toLowerCase());
       }));
  }

  render() {
    if (!this.isDebuggable()) {
      return <React.Fragment/>;
    }
    return (
      <Button color="primary" onClick={() => this.onClick()}>
        <FontAwesome className="mr-2" name="bug"/>
        Debug
      </Button>
    );
  }
}

DebugButton.defaultProps = {
  forceDebuggable: false,
  onClick: () => undefined
}

DebugButton.propTypes = {
  onClick: PropTypes.func,
  forceDebuggable: PropTypes.bool,
  history: PropTypes.object,
  transaction: PropTypes.object,
  contracts: PropTypes.arrayOf(PropTypes.object)
};

export default withRouter(DebugButton);
