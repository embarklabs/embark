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
          className="card-table table-vcenter text-nowrap"
          headerItems={[
            {content: "call"},
            {content: "Transaction hash"},
            {content: "Gas Used"},
            {content: "Block number"},
            {content: "Status"}
          ]}
          bodyItems={
            contractLogs.map((log) => {
              return ([
                {content: `${log.name}.${log.functionName}(${log.paramString})`},
                {content: log.transactionHash},
                {content: log.gasUsed},
                {content: log.blockNumber},
                {content: log.status}
              ]);
            })
          }
        />
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

ContractLogger.propTypes = {
  contractName: PropTypes.string.isRequired,
  contractLogs: PropTypes.array.isRequired
};

export default ContractLogger;

