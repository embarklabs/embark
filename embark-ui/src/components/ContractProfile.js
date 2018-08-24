import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";

const ContractProfile = ({contractProfile}) => (
  <Page.Content title={contractProfile.name + ' Profile'}>
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
                <Table.ColHeader>Function</Table.ColHeader>
                <Table.ColHeader>Payable</Table.ColHeader>
                <Table.ColHeader>Mutability</Table.ColHeader>
                <Table.ColHeader>Inputs</Table.ColHeader>
                <Table.ColHeader>Outputs</Table.ColHeader>
                <Table.ColHeader>Gas Estimates</Table.ColHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                contractProfile.methods.map((method) => {
                  return (
                    <Table.Row key={method.name}>
                      <Table.Col>{method.name}</Table.Col>
                      <Table.Col>{(method.payable === true).toString()}</Table.Col>
                      <Table.Col>{method.mutability}</Table.Col>
                      <Table.Col>{`(${method.inputs.map((x) => x.type).join(',')})`}</Table.Col>
                      <Table.Col>{`(${method.outputs.map((x) => x.type).join(',')})`}</Table.Col>
                      <Table.Col>{method.gasEstimates}</Table.Col>
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

ContractProfile.propTypes = {
  contractProfile: PropTypes.object
};

export default ContractProfile;

