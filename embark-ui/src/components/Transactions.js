import React from 'react';
import {Link} from "react-router-dom";
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import PropTypes from 'prop-types';

const Transactions = ({transactions}) => (
  <Page.Content title="Transactions">
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
                <Table.ColHeader>Hash</Table.ColHeader>
                <Table.ColHeader>Block Number</Table.ColHeader>
                <Table.ColHeader>From</Table.ColHeader>
                <Table.ColHeader>To</Table.ColHeader>
                <Table.ColHeader>Type</Table.ColHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                transactions.reduce((transaction) => {
                  return (
                    <Table.Row key={transaction.hash}>
                      <Table.Col><Link to={`/embark/explorer/transactions/${transaction.hash}`}>{transaction.hash}</Link></Table.Col>
                      <Table.Col>{transaction.blockNumber}</Table.Col>
                      <Table.Col>{transaction.from}</Table.Col>
                      <Table.Col>{transaction.to}</Table.Col>
                      <Table.Col>{transaction.to ? "Contract Call" : "Contract Creation"}</Table.Col>
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

Transactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object)
};

export default Transactions;
