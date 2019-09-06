import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Row,
  Col,
  Input,
  Button
} from "reactstrap";
import ReactJson from 'react-json-view';
import DebugButton from './DebugButton';
import {withRouter} from "react-router-dom";

class ContractDebugger extends Component {
  constructor(props) {
    super(props);
    this.state = {txHash: ''};
  }

  componentDidMount() {
    if (this.props.debuggerTransactionHash) {
      this.setState({txHash: this.props.debuggerTransactionHash});
      this.props.startDebug(this.props.debuggerTransactionHash);
    }
  }

  handleChange(e) {
    this.setState({txHash: e.target.value});
  }

  debugJumpBack(_e) {
    this.props.debugJumpBack();
  }

  debugJumpForward(_e) {
    this.props.debugJumpForward();
  }

  debugStepOverForward(_e) {
    this.props.debugStepOverForward();
  }

  debugStepOverBackward(_e) {
    this.props.debugStepOverBackward();
  }

  debugStepIntoForward(_e) {
    this.props.debugStepIntoForward();
  }

  debugStepIntoBackward(_e) {
    this.props.debugStepIntoBackward();
  }

  stopDebug(_e) {
    this.props.stopDebug();
    this.props.history.push('/editor');
  }

  canGoPrevious() {
    const { possibleSteps } = this.props.debuggerInfo;
    return possibleSteps && possibleSteps.canGoPrevious;
  }

  canGoNext() {
    const { possibleSteps } = this.props.debuggerInfo;
    return possibleSteps && possibleSteps.canGoNext;
  }

  render() {
    return (
      <div>
        <Row>
          <Col>
            <Input className="mb-1" name="txHash" id="txHash" value={this.state.txHash} onChange={(e) => this.handleChange(e)}/>
            <DebugButton forceDebuggable
                         onClick={() => this.props.startDebug(this.state.txHash)}
                         transaction={{hash: this.state.txHash}} />
          </Col>
        </Row>
        <Row className="mt-2">
          <Col>
            <Button color="light" className="btn-square debugButton jumpBack" alt="jump to previous breakpoint" onClick={(e) => this.debugJumpBack(e)}></Button>
            <Button color="light" className="btn-square debugButton jumpForward" alt="jump to revious breakpoint" onClick={(e) => this.debugJumpForward(e)}></Button>
            <Button color="light" className={"btn-square debugButton stepOverBack" + (this.canGoPrevious() ? '' : ' disabled')} alt="step back" onClick={(e) => this.debugStepOverBackward(e)}></Button>
            <Button color="light" className={"btn-square debugButton stepOverForward" + (this.canGoNext() ? '' : ' disabled')} alt="step over" onClick={(e) => this.debugStepOverForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoForward" alt="step into" onClick={(e) => this.debugStepIntoForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoBack" alt="step out" onClick={(e) => this.debugStepIntoBackward(e)}></Button>
            <Button color="light" className="btn-square debugButton stop" alt="stop" onClick={(e) => this.stopDebug(e)}></Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <br /><strong>Scopes</strong>
            <div>
              <ReactJson src={{locals: this.props.debuggerInfo.locals, contract: this.props.debuggerInfo.contract, globals: this.props.debuggerInfo.globals}} theme="monokai" sortKeys={true} name={false} collapse={1} style={{"overflowX": "auto"}} shouldCollapse={(field) => { return (field.name === 'globals'); }} />
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

ContractDebugger.propTypes = {
  debuggerTransactionHash: PropTypes.string,
  startDebug: PropTypes.func,
  stopDebug: PropTypes.func,
  debugJumpBack: PropTypes.func,
  debugJumpForward: PropTypes.func,
  debugStepOverForward: PropTypes.func,
  debugStepOverBackward: PropTypes.func,
  debugStepIntoForward: PropTypes.func,
  debugStepIntoBackward: PropTypes.func,
  debuggerInfo: PropTypes.object,
  history: PropTypes.object
};

export default withRouter(ContractDebugger);

