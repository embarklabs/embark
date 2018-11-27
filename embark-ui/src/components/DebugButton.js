
import React from 'react';
import PropTypes from 'prop-types';
import {Button} from "reactstrap";
import FontAwesome from 'react-fontawesome';
import {withRouter} from "react-router-dom";

class DebugButton extends React.Component {
  onClick() {
    this.props.history.push(`/embark/editor?debuggerTransactionHash=${this.props.transaction.hash}`);
    this.props.onClick();
  }

  isDebuggable() {
    return this.props.forceDebuggable ||
      (this.props.contracts && this.props.contracts.find(contract => contract.address === this.props.transaction.to));
  }

  render() {
    if (!this.isDebuggable()) {
      return <React.Fragment />
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