import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import {Link} from 'react-router-dom';

const ContractProfile = ({contract}) => (
  <Page.Content title={contract.name}>
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
              contract.methods.map((method) => {
                return ([
                  {content: method.name},
                  {content: (method.payable == true).toString()},
                  {content: method.mutability},
                  {content: `(${method.inputs.map((x) => x.type).join(',')})`},
                  {content: `(${method.outputs.map((x) => x.type).join(',')})`},
                  {content: method.gasEstimates},
                ]);
              })
            }
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
)

export default ContractProfile;

