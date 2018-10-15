import React from 'react';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

const Block = ({block}) => (
  <Row>
    <Col>
      <h1>Block {block.number}</h1>
      <p>Timestamp: {block.timestamp}</p>
      <p>Gas used: {block.gasUsed}</p>
    </Col>
  </Row>
);

Block.propTypes = {
  block: PropTypes.object
};

export default Block;
