import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardTitle, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';

const Blocks = ({blocks}) => (
  <Row>
    <Col>
      <h1>Blocks</h1>
      {blocks.map(block => (
        <Card>
          <CardHeader>
            <Link to={`/embark/explorer/blocks/${block.number}`}> <CardTitleIdenticon id={block.hash}>Block {block.number}</CardTitleIdenticon></Link>
          </CardHeader>
          <CardBody>
            <Row>
              <Col>
                <strong>Number</strong>
                <br/>
                {block.number}
              </Col>
              <Col>
                <strong>Mined On</strong>
                <br/>
                {new Date(block.timestamp * 1000).toLocaleString()}
              </Col>
              <Col>
                <strong>Gas Used</strong>
                <br/>
                {block.gasUsed}
              </Col>
              <Col>
                <strong>TX Count</strong>
                <br/>
                {block.transactions.length}
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
