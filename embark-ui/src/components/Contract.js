import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";

const Contract = ({contract}) => (
  <Page.Content title="Contract">
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            className="card-table table-vcenter text-nowrap"
          >
            <Table.Header>
              <Table.Row>
                <Table.ColHeader>Name</Table.ColHeader>
                <Table.ColHeader>Address</Table.ColHeader>
                <Table.ColHeader>State</Table.ColHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Col>{(contract.name || contract.className)}</Table.Col>
                <Table.Col>{(contract.address || contract.deployedAddress)}</Table.Col>
                <Table.Col>{contract.deploy}</Table.Col>
              </Table.Row>
            </Table.Body>
          </Table>
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Contract.propTypes = {
  contract: PropTypes.object
};

export default Contract;

