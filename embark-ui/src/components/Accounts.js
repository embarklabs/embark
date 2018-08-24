import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

const Accounts = ({accounts}) => (
  <Page.Content title="Accounts">
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            className="card-table table-vcenter text-nowrap"
          >
            <Table.Header>
              <Table.Row>
                <Table.ColHeader>Address</Table.ColHeader>
                <Table.ColHeader>Balance</Table.ColHeader>
                <Table.ColHeader>TX count</Table.ColHeader>
                <Table.ColHeader>Index</Table.ColHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                accounts.map((account) => {
                  return (
                    <Table.Row key={account.address}>
                      <Table.Col><Link to={`/embark/explorer/accounts/${account.address}`}>{account.address}</Link></Table.Col>
                      <Table.Col>{account.balance}</Table.Col>
                      <Table.Col>{account.transactionCount}</Table.Col>
                      <Table.Col>{account.index}</Table.Col>
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

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object)
};

export default Accounts;
