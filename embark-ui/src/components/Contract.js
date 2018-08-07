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
            headerItems={[
              {content: "Name"},
              {content: "Address"},
              {content: "State"}
            ]}
            bodyItems={[
              [
                {content: (contract.name || contract.className)},
                {content: (contract.address || contract.deployedAddress)},
                {content: contract.deploy.toString()}
              ]
            ]}
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Contract.propTypes = {
  contract: PropTypes.object
};

export default Contract;

