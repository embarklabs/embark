import React from 'react';
import {Link} from "react-router-dom";
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import PropTypes from 'prop-types';

const Blocks = ({blocks}) => (
  <Page.Content title="Blocks">
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
                <Table.ColHeader>Number</Table.ColHeader>
                <Table.ColHeader>Mined On</Table.ColHeader>
                <Table.ColHeader>Gas Used</Table.ColHeader>
                <Table.ColHeader>TX Count</Table.ColHeader>
              </Table.Row>
            </Table.Header>  
            <Table.Body>
              {
                blocks.map((block) => {
                  return (
                    <Table.Row key={block.number}>
                      <Table.Col><Link to={`/embark/explorer/blocks/${block.number}`}>{block.number}</Link></Table.Col>
                      <Table.Col>{new Date(block.timestamp * 1000).toLocaleString()}</Table.Col>
                      <Table.Col>{block.gasUsed}</Table.Col>
                      <Table.Col>{block.transactions.length}</Table.Col>
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

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object)
};

export default Blocks;
