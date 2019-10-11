import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Table, FormGroup, Label, Input, Form, UncontrolledTooltip} from 'reactstrap';
import DebugButton from './DebugButton';

import "./ContractLog.scss";

const TX_STATES = {Any: '', Success: '0x1', Fail: '0x0'};
const EVENT = 'event';
const FUNCTION = 'function';

class ContractLog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {method: '', event: '', status: TX_STATES['Any']};
  }

  getMethods() {
    if (!this.props.contract.abiDefinition) {
      return [];
    }

    return this.props.contract.abiDefinition.filter(method => method.type === FUNCTION);
  }

  getEvents() {
    if (!this.props.contract.abiDefinition) {
      return [];
    }

    return this.props.contract.abiDefinition.filter(method => method.type === EVENT);
  }

  updateState(key, value) {
    this.setState({[key]: value});
  }

  dataToDisplay() {
    return this.props.contractLogs.map(contractLog => {
      const events = this.props.contractEvents
        .filter(contractEvent => contractEvent.transactionHash === contractLog.transactionHash)
        .map(contractEvent => contractEvent.event);
      contractLog.events = events;
      return contractLog;
    }).filter(contractLog => {
      if (this.state.status && contractLog.status !== this.state.status) {
        return false;
      }

      if (this.state.method && this.state.event) {
        return this.state.method === contractLog.functionName &&
          contractLog.events.includes(this.state.event);
      }

      if (this.state.method) {
        return this.state.method === contractLog.functionName;
      }

      if (this.state.event) {
        return contractLog.events.includes(this.state.event);
      }

      return true;
    });
  }

  render() {
    return (
      <React.Fragment>
        <Form>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label htmlFor="functions">Functions</Label>
                <Input type="select"
                       name="functions"
                       id="functions"
                       onChange={(event) => this.updateState('method', event.target.value)}
                       value={this.state.method}>
                  <option value="">(all)</option>
                  {this.getMethods().map((method, index) => (
                    <option value={method.name} key={index}>
                      {method.name}
                    </option>))}
                  <option value="constructor">constructor</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label htmlFor="events">Events</Label>
                <Input type="select"
                       name="events"
                       id="events"
                       onChange={(event) => this.updateState('event', event.target.value)}
                       value={this.state.event}>
                  <option value="">(all)</option>
                  {this.getEvents().map((event, index) => (
                    <option value={event.name} key={index}>
                      {event.name}
                    </option>))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label htmlFor="events">Status</Label>
                <Input type="select"
                       name="status"
                       id="status"
                       onChange={(event) => this.updateState('status', event.target.value)}
                       value={this.state.status}>
                  {Object.keys(TX_STATES).map((key, index) => (
                    <option value={TX_STATES[key]} key={index}>
                      {key === 'Any' ? '(any)' : key}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
        </Form>
        <Row>
          <Col className="overflow-auto">
            <Table className="contract-log">
              <thead>
                <tr>
                  <th/>
                  <th>Invocation</th>
                  <th>Events</th>
                  <th>Gas</th>
                  <th>Block</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.dataToDisplay().map((log, index) => {
                    return (
                      <tr key={'log-' + index}>
                        <td><DebugButton contracts={[this.props.contract]}
                                         transaction={
                                           {...log,
                                            hash: log.transactionHash,
                                            isCall: log.kind === 'call',
                                            isConstructor: log.functionName === 'constructor'}}/></td>
                        <td>{`${log.name}.${log.functionName}(${log.paramString})`}</td>
                        <td>{log.events.join(', ')}</td>
                        <td>{log.gasUsed}</td>
                        <td>{log.blockNumber}</td>
                        <td id={'tx-status-' + index}>
                          {log.status}
                          {log.reason && <sup>?</sup>}
                          {log.reason && <UncontrolledTooltip placement="bottom" target={'tx-status-' + index}>
                            Reason of the failure: {log.reason}
                          </UncontrolledTooltip>}
                        </td>
                        <td>{log.transactionHash}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </Table>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

ContractLog.propTypes = {
  contractLogs: PropTypes.array,
  contractEvents: PropTypes.array,
  contract: PropTypes.object.isRequired
};

export default ContractLog;
