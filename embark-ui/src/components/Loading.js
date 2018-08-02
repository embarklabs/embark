import React from 'react';
import {Grid, Loader} from 'tabler-react';

const Loading = () => (
  <Grid.Row className="align-items-center h-100 mt-5">
    <Grid.Col>
      <Loader className="mx-auto" />
    </Grid.Col>
  </Grid.Row>
);

export default Loading;
