import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Page,
  Grid, Table
} from "tabler-react";
import {
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import ReactJson from 'react-json-view';

class ContractDebugger extends Component {

  constructor(props) {
    super(props);
  }

  handleChange(e) {
    this.setState({txHash: e.target.value});
  }

  debug(e) {
    this.props.startDebug(this.state.txHash);
  }

  debugJumpBack(e) {
    this.props.debugJumpBack()
  }

  debugJumpForward(e) {
    this.props.debugJumpForward()
  }

  debugStepOverForward(e) {
    this.props.debugStepOverForward()
  }

  debugStepOverBackward(e) {
    this.props.debugStepOverBackward()
  }

  debugStepIntoForward(e) {
    this.props.debugStepIntoForward()
  }

  debugStepIntoBackward(e) {
    this.props.debugStepIntoBackward()
  }

  render() {
    return (
      <Page.Content title={this.props.contract.className + ' Debugger'}>
        <Grid.Row>
          <Grid.Col>
            <Input name="txHash" id="txHash" onChange={(e) => this.handleChange(e)}/>
            <Button color="primary" onClick={(e) => this.debug(e)}>Debug Tx</Button>
          </Grid.Col>
        </Grid.Row>

        <Grid.Row>
          <Grid.Col>
            <Button color="light" className="btn-square debugButton jumpBack" alt="jump to previous breakpoint" onClick={(e) => this.debugJumpBack(e)}></Button>
            <Button color="light" className="btn-square debugButton jumpForward" alt="jump to revious breakpoint" onClick={(e) => this.debugJumpForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepOverBack" alt="step back" onClick={(e) => this.debugStepOverBackward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepOverForward" alt="step over" onClick={(e) => this.debugStepOverForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoForward" alt="step into" onClick={(e) => this.debugStepIntoForward(e)}></Button>
            <Button color="light" className="btn-square debugButton stepIntoBack" alt="step out" onClick={(e) => this.debugStepIntoBackward(e)}></Button>
          </Grid.Col>
        </Grid.Row>

        <Grid.Row>
          <Grid.Col>
            <br /><strong>Scopes</strong>
            <div>
              <ReactJson src={{locals: this.props.debuggerInfo.locals, contract: this.props.debuggerInfo.globals}} theme="monokai" sortKeys={true} name={false} collapse={1} />
            </div>
          </Grid.Col>
        </Grid.Row>
      </Page.Content>
    );
  }
}

ContractDebugger.propTypes = {
  contract: PropTypes.object.isRequired,
};

export default ContractDebugger;

