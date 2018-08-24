import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import {formatContractForDisplay} from '../utils/presentation';
import {withRouter} from 'react-router-dom';

const Contract = ({contract, match}) => {
  const contractDisplay = formatContractForDisplay(contract);
  return (
    <Page.Content title={match.params.contractName + " Overview"}>
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
                <Table.Row className={contractDisplay.stateColor}>
                  <Table.Col>{(contract.name || contract.className)}</Table.Col>
                  <Table.Col>{contractDisplay.address}</Table.Col>
                  <Table.Col>{contractDisplay.state}</Table.Col>
                </Table.Row>
              </Table.Body>
            </Table>
          </Card>
        </Grid.Col>
      </Grid.Row>
    </Page.Content>
  );
};

Contract.propTypes = {
  contract: PropTypes.object,
  match: PropTypes.object
};

export default withRouter(Contract);

