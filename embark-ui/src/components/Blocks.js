import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Blocks = ({blocks}) => (
  <Row>
    <Col>
      <h1>Blocks</h1>
      {blocks.map(block => (
        <Card key={block.number}>
          <CardHeader>
            <CardTitleIdenticon id={block.hash}>Block&nbsp;
              <Link to={`/embark/explorer/blocks/${block.number}`}>
                {block.number}
              </Link>
            </CardTitleIdenticon>
          </CardHeader>
          <CardBody>
            <Row>
              <Col>
                <strong>Number</strong>
                <div>{block.number}</div>
              </Col>
              <Col>
                <strong>Mined On</strong>
                <div>{new Date(block.timestamp * 1000).toLocaleString()}</div>
              </Col>
              <Col>
                <strong>Gas Used</strong>
                <div>{block.gasUsed}</div>
              </Col>
              <Col>
                <strong>TX Count</strong>
                <div>{block.transactions.length}</div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      ))}
    </Col>
  </Row>
);

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object)
};

export default Blocks;
