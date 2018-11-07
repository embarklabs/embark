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

  render() {
    return (
      <div>
        <Row>
          <Col>
            <Input name="txHash" id="txHash" value={this.state.txHash} onChange={(e) => this.handleChange(e)}/>
            <DebugButton forceDebuggable transaction={{hash: this.state.txHash}} />
          </Col>
        </Row>
        <Row>
          <Col>
            <Button color="light" className="btn-square debugButton jumpBack" alt="jump to previous breakpoint" onClick={(e) => this.debugJumpBack(e)}></Button>
            <Button color="light" className="btn-square debugButton jumpForward" alt="jump to revious breakpoint" onClick={(e) => this.debugJumpForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepOverBack" alt="step back" onClick={(e) => this.debugStepOverBackward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepOverForward" alt="step over" onClick={(e) => this.debugStepOverForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoForward" alt="step into" onClick={(e) => this.debugStepIntoForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoBack" alt="step out" onClick={(e) => this.debugStepIntoBackward(e)}></Button>
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
  debugJumpBack: PropTypes.func,
  debugJumpForward: PropTypes.func,
  debugStepOverForward: PropTypes.func,
  debugStepOverBackward: PropTypes.func,
  debugStepIntoForward: PropTypes.func,
  debugStepIntoBackward: PropTypes.func,
  debuggerInfo: PropTypes.object
};

export default ContractDebugger;

