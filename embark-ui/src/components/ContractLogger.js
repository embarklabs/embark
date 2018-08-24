import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid, Table
} from "tabler-react";

const ContractLogger = ({contractName, contractLogs}) => (
  <Page.Content title={contractName + ' Logger'}>
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
              contractLogs.map((log) => {
                return (
                  <Table.Row key={log.name}>
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

ContractLogger.propTypes = {
  contractName: PropTypes.string.isRequired,
  contractLogs: PropTypes.array.isRequired
};

export default ContractLogger;

