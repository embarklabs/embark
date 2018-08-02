import React from 'react';
import {Grid, Button} from 'tabler-react';
import PropTypes from 'prop-types';

const LoadMore = ({loadMore}) => (
  <Grid.Row className="my-3">
    <Grid.Col className="text-center">
      <Button onClick={loadMore} icon="plus" outline color="primary">Load More</Button>
    </Grid.Col>
  </Grid.Row>
);

LoadMore.propTypes = {
  loadMore: PropTypes.func
};

export default LoadMore;
