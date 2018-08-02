import React from 'react';
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
            className="card-table table-vcenter text-nowrap"
            headerItems={[{content: "Number"}, {content: "Mined On"}, {content: "Gas Used"}, {content: "TX Count"}]}
            bodyItems={
              blocks.map((block) => {
                return ([
                  {content: block.number},
                  {content: new Date(block.timestamp * 1000).toLocaleString()},
                  {content: block.gasUsed},
                  {content: block.transactions.length}
                ]);
              })
            }
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object)
};

export default Blocks;
