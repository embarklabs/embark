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
          <thead>
            <tr>
              <th>call</th>
              <th>Transaction hash</th>
              <th>Gas Used</th>
              <th>Block number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {
              contractLogs.map((log, index) => {
                return (
                  <tr key={'log-' + index}>
                    <td>{`${log.name}.${log.functionName}(${log.paramString})`}</td>
                    <td>{log.transactionHash}</td>
                    <td>{log.gasUsed}</td>
                    <td>{log.blockNumber}</td>
                    <td>{log.status}</td>
                  </tr>
                );
              })
            }
          </tbody>
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

