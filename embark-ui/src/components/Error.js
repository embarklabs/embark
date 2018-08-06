import PropTypes from "prop-types";
import React from 'react';
import {Grid} from 'tabler-react';

const Error = ({error}) => (
  <Grid.Row className="align-items-center h-100 mt-5">
    <Grid.Col>
      <p className="text-center alert-danger">
        {error}
      </p>
    </Grid.Col>
  </Grid.Row>
);

Error.propTypes = {
  error: PropTypes.string
};

export default Error;
