import React from 'react';
import {
  Page,
  Grid,
  Card,
  Table
} from "tabler-react";
import PropTypes from 'prop-types';


const Accounts = ({accounts}) => (
  <Page.Content title="Accounts">
    <Grid.Row>
      <Grid.Col>
        <Card>
          <Table
            responsive
            className="card-table table-vcenter text-nowrap"
            headerItems={[
              {content: "Address"},
              {content: "Balance"},
              {content: "TX count"},
              {content: "Index"}
            ]}
            bodyItems={
              accounts.map((account) => {
                return ([
                  {content: account.address},
                  {content: account.balance},
                  {content: account.transactionCount},
                  {content: account.index}
                ]);
              })
            }
          />
        </Card>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Accounts.propTypes = {
  accounts: PropTypes.object
};

export default Accounts;
