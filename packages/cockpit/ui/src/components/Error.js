import PropTypes from "prop-types";
import React from 'react';
import {Row, Col} from 'reactstrap';

const Error = ({error}) => (
  <Row className="align-items-center mt-5">
    <Col>
      <p className="text-center alert-danger">
        {error}
      </p>
    </Col>
  </Row>
);

Error.propTypes = {
  error: PropTypes.string
};

export default Error;
