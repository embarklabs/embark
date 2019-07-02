import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';
import Pagination from './Pagination';
import {formatTimestampForDisplay} from '../utils/presentation';

import CardTitleIdenticon from './CardTitleIdenticon';

const Blocks = ({blocks, changePage, currentPage, numberOfPages}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>Blocks</h2>
        </CardHeader>
        <CardBody>
          {!blocks.length && "No blocks to display"}
          {blocks.map(block => (
            <div className="explorer-row border-top" key={block.number}>
              <CardTitleIdenticon id={block.hash}>Block&nbsp;
                <Link to={`/explorer/blocks/${block.number}`}>
                  {block.number}
                </Link>
              </CardTitleIdenticon>
              <Row>
                <Col>
                  <strong>Mined on:</strong>
                  <div>{formatTimestampForDisplay(block.timestamp)}</div>
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
            </div>
          ))}
          {numberOfPages > 1 && <Pagination changePage={changePage} currentPage={currentPage} numberOfPages={numberOfPages}/>}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object),
  changePage: PropTypes.func,
  currentPage: PropTypes.number,
  numberOfPages: PropTypes.number
};

export default Blocks;
