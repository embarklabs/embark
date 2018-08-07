import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";

const ContractProfile = ({contractProfile}) => (
  <Page.Content title={contractProfile.name}>
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            className="card-table table-vcenter text-nowrap"
            headerItems={[
              {content: "Function"},
              {content: "Payable"},
              {content: "Mutability"},
              {content: "Inputs"},
              {content: "Outputs"},
              {content: "Gas Estimates"}
            ]}
            bodyItems={
              contractProfile.methods.map((method) => {
                return ([
                  {content: method.name},
                  {content: (method.payable === true).toString()},
                  {content: method.mutability},
                  {content: `(${method.inputs.map((x) => x.type).join(',')})`},
                  {content: `(${method.outputs.map((x) => x.type).join(',')})`},
                  {content: method.gasEstimates}
                ]);
              })
            }
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

ContractProfile.propTypes = {
  contractProfile: PropTypes.object
};

export default ContractProfile;

