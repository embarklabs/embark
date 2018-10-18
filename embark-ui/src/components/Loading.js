import React from 'react';
import {Row, Col} from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import "./Loading.css";

const Loading = () => (
  <Row className="align-items-center mt-5">
    <Col className="text-center">
      <FontAwesome name="spinner" spin size="3x" />
    </Col>
  </Row>
);

export default Loading;
