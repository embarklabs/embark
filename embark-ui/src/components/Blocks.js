import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';
import LoadMore from "./LoadMore";

const Blocks = ({blocks, showLoadMore, loadMore}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>Blocks</h2>
        </CardHeader>
        <CardBody>
          {blocks.map(block => (
            <div className="explorer-row border-top" key={block.number}>
              <CardTitleIdenticon id={block.hash}>Block&nbsp;
                <Link to={`/embark/explorer/blocks/${block.number}`}>
                  {block.number}
                </Link>
              </CardTitleIdenticon>
              <Row>
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
            </div>
          ))}
          {showLoadMore && <LoadMore loadMore={() => loadMore()}/>}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object),
  showLoadMore: PropTypes.bool,
  loadMore: PropTypes.func
};

export default Blocks;
