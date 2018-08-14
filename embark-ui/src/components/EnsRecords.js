import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import PropTypes from 'prop-types';

const EnsRecords = ({ensRecords}) => (
  <Page.Content title="Records">
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            className="card-table table-vcenter text-nowrap"
            headerItems={[
              {content: "Name"},
              {content: "Address"}
            ]}
            bodyItems={
              ensRecords.map((ensRecord) => {
                return ([
                  {content: ensRecord.name},
                  {content: ensRecord.address}
                ]);
              })
            }
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

EnsRecords.propTypes = {
  ensRecords: PropTypes.arrayOf(PropTypes.object)
};

export default EnsRecords;
