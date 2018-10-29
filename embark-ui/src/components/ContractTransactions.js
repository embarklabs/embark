import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Table, FormGroup, Label, Input, Form} from 'reactstrap';

const TX_STATES = {Success: '0x1', Fail: '0x0', Any: ''};
const EVENT = 'event';
const FUNCTION = 'function';
const CONSTRUCTOR = 'constructor';
const PURE = 'pure';
const VIEW = 'view';

class ContractTransactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {method: '', event: '', status: TX_STATES['Any']};
  }

  getMethods() {
    if (!this.props.contract.abiDefinition) {
      return [];
    }

    return this.props.contract.abiDefinition.filter(method => (
      method.name !== CONSTRUCTOR && method.mutability !== VIEW && method.mutability !== PURE && method.constant !== true && method.type === FUNCTION
    ));
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

      if (this.state.method || this.state.event) {
        return this.state.method === contractLog.functionName || contractLog.events.includes(this.state.event);
      }

      return true;
    });
  }

  render() {
    return (
      <React.Fragment>
        <Form>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label htmlFor="functions">Functions</Label>
                <Input type="select" name="functions" id="functions" onChange={(event) => this.updateState('method', event.target.value)} value={this.state.method}>
                  <option value=""></option>
                  {this.getMethods().map((method, index) => <option value={method.name} key={index}>{method.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label htmlFor="events">Events</Label>
                <Input type="select" name="events" id="events" onChange={(event) => this.updateState('eveny', event.target.value)} value={this.state.event}>
                  <option value=""/>
                  {this.getEvents().map((event, index) => <option value={event.name} key={index}>{event.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col>
              <FormGroup row>
                <Col md="3">
                  <Label>Tx Status</Label>
                </Col>
                <Col md="9">
                  {Object.keys(TX_STATES).map(key => (
                    <FormGroup key={key} check inline>
                      <Input className="form-check-input"
                            type="radio"
                            id={key}
                            name={key}
                            value={TX_STATES[key]}
                            onChange={(event) => this.updateState('status', event.target.value)}
                            checked={TX_STATES[key] === this.state.status} />
                      <Label check className="form-check-label" htmlFor={key}>{key}</Label>
                    </FormGroup>
                  ))}
                </Col>
              </FormGroup>
            </Col>
          </Row>
        </Form>
        <Row>
          <Col className="overflow-auto">
            <Table>
              <thead>
                <tr>
                  <th>Call</th>
                  <th>Events</th>
                  <th>Gas Used</th>
                  <th>Block number</th>
                  <th>Status</th>
                  <th>Transaction hash</th>
                </tr>
              </thead>
              <tbody>
                {
                  this.dataToDisplay().map((log, index) => {
                    return (
                      <tr key={'log-' + index}>
                        <td>{`${log.name}.${log.functionName}(${log.paramString})`}</td>
                        <td>{log.events.join(', ')}</td>
                        <td>{log.gasUsed}</td>
                        <td>{log.blockNumber}</td>
                        <td>{log.status}</td>
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

ContractTransactions.propTypes = {
  contractLogs: PropTypes.array,
  contractEvents: PropTypes.array,
  contract: PropTypes.object.isRequired
};

export default ContractTransactions;

