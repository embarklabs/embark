import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Table,
  Form
} from "tabler-react";

const TX_STATES = {Success: '0x1', Fail: '0x0', Any: ''};

class ContractLogger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {method: '', event: '', status: TX_STATES['Any']};
  }

  getMethods() {
    if (!this.props.contract.abiDefinition) {
      return [];
    }

    return this.props.contract.abiDefinition.filter(method => (
      method.name !== 'constructor' && method.mutability !== 'view' && method.mutability !== 'pure' && method.constant !== true && method.type === 'function'
    ));
  }

  getEvents() {
    if (!this.props.contract.abiDefinition) {
      return [];
    }
    return this.props.contract.abiDefinition.filter(method => method.type === 'event');
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
      <Page.Content title={this.props.contract.className + ' Logger'}>
        <Form>
          <Grid.Row>
            <Grid.Col md={6}>
              <Form.Group label="Functions">
                <Form.Select onChange={(event) => this.updateState('method', event.target.value)} value={this.state.method}>
                  <option value=""></option>
                  {this.getMethods().map((method, index) => <option value={method.name} key={index}>{method.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Grid.Col>
            <Grid.Col md={6}>
              <Form.Group label="Events">
                <Form.Select onChange={(event) => this.updateState('event', event.target.value)} value={this.state.event}>
                  <option value=""></option>
                  {this.getEvents().map((event, index) => <option value={event.name} key={index}>{event.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Grid.Col>
            <Grid.Col>
              <Form.Group label="Tx Status">
                {Object.keys(TX_STATES).map(key => (
                  <Form.Radio
                    key={key}
                    isInline
                    label={key}
                    value={TX_STATES[key]}
                    onChange={(event) => this.updateState('status', event.target.value)}
                    checked={TX_STATES[key] === this.state.status}
                  />
                ))}
              </Form.Group>
            </Grid.Col>
          </Grid.Row>
        </Form>
        <Grid.Row>
          <Grid.Col>
            <Table
              responsive
              cards
              verticalAlign="center"
              className="text-nowrap">
              <Table.Header>
                <Table.Row>
                  <Table.ColHeader>Call</Table.ColHeader>
                  <Table.ColHeader>Events</Table.ColHeader>
                  <Table.ColHeader>Gas Used</Table.ColHeader>
                  <Table.ColHeader>Block number</Table.ColHeader>
                  <Table.ColHeader>Status</Table.ColHeader>
                  <Table.ColHeader>Transaction hash</Table.ColHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                  this.dataToDisplay().map((log, index) => {
                    return (
                      <Table.Row key={'log-' + index}>
                        <Table.Col>{`${log.name}.${log.functionName}(${log.paramString})`}</Table.Col>
                        <Table.Col>{log.events.join(', ')}</Table.Col>
                        <Table.Col>{log.gasUsed}</Table.Col>
                        <Table.Col>{log.blockNumber}</Table.Col>
                        <Table.Col>{log.status}</Table.Col>
                        <Table.Col>{log.transactionHash}</Table.Col>
                      </Table.Row>
                    );
                  })
                }
              </Table.Body>
            </Table>
          </Grid.Col>
        </Grid.Row>
      </Page.Content>
    );
  }
}

ContractLogger.propTypes = {
  contractLogs: PropTypes.array,
  contractEvents: PropTypes.array,
  contract: PropTypes.object.isRequired
};

export default ContractLogger;

