import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Table,
  Form
} from "tabler-react";

class ContractLogger extends React.Component {

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

  render() {
    return (
      <Page.Content title={this.props.contractName + ' Logger'}>
        <Form>
          <Grid.Row>
            <Grid.Col md={6}>
              <Form.Group label="Functions">
                <Form.Select>
                  {this.getMethods().map((method, index) => <option key={index}>{method.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Grid.Col>
            <Grid.Col md={6}>
              <Form.Group label="Events">
                <Form.Select>
                  {this.getEvents().map((event, index) => <option key={index}>{event.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Grid.Col>
            <Grid.Col>
              <Form.Group label="Tx Status">
                <Form.Radio
                  isInline
                  label="Failed"
                  name="example-inline-radios"
                  value="option1"
                />
                <Form.Radio
                  isInline
                  label="Success"
                  name="example-inline-radios"
                  value="option2"
                />
                <Form.Radio
                  isInline
                  label="Any"
                  name="example-inline-radios"
                  value="option3"
                />
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
                  <Table.ColHeader>call</Table.ColHeader>
                  <Table.ColHeader>Transaction hash</Table.ColHeader>
                  <Table.ColHeader>Gas Used</Table.ColHeader>
                  <Table.ColHeader>Block number</Table.ColHeader>
                  <Table.ColHeader>Status</Table.ColHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                  this.props.contractLogs.map((log, index) => {
                    return (
                      <Table.Row key={'log-' + index}>
                        <Table.Col>{`${log.name}.${log.functionName}(${log.paramString})`}</Table.Col>
                        <Table.Col>{log.transactionHash}</Table.Col>
                        <Table.Col>{log.gasUsed}</Table.Col>
                        <Table.Col>{log.blockNumber}</Table.Col>
                        <Table.Col>{log.status}</Table.Col>
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
  contractName: PropTypes.string.isRequired,
  contractLogs: PropTypes.array.isRequired.Header,
  contract: PropTypes.object.isRequired
};

export default ContractLogger;

