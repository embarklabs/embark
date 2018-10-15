import React from 'react';
import {Row, Col} from 'reactstrap';

import "./Loading.css";

const Loading = () => (
  <Row className="align-items-center mt-5">
    <Col className="text-center">
      <i className="fa fa-spinner fa-spin fa-3x fa-fw"></i>
    </Col>
  </Row>
);

export default Loading;
