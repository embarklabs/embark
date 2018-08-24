import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import {Link} from 'react-router-dom';
import {formatContractForDisplay} from '../utils/presentation';

const Contracts = ({contracts}) => (
  <Page.Content title="Contracts">
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            cards
            verticalAlign="center"
            className="text-nowrap">
            <Table.Header>
              <Table.Row>
                <Table.ColHeader>Name</Table.ColHeader>
                <Table.ColHeader>Address</Table.ColHeader>
                <Table.ColHeader>State</Table.ColHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                contracts.map((contract) => {
                  const contractDisplay = formatContractForDisplay(contract);
                  return (
                    <Table.Row key={contract.className} className={contractDisplay.stateColor}>
                      <Table.Col><Link to={`/embark/contracts/${contract.className}/overview`}>{contract.className}</Link></Table.Col>
                      <Table.Col>{contractDisplay.address}</Table.Col>
                      <Table.Col>{contractDisplay.state}</Table.Col>
                    </Table.Row>
                  );
                })
              }
            </Table.Body>
          </Table>
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Contracts.propTypes = {
  contracts: PropTypes.arrayOf(PropTypes.object)
};

export default Contracts;

