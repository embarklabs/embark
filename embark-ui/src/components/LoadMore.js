import React from 'react';
import {Row, Col, Button} from 'reactstrap';
import PropTypes from 'prop-types';

const LoadMore = ({loadMore}) => (
  <Row className="my-3">
    <Col className="text-center">
      <Button onClick={loadMore} icon="plus" outline color="primary">Load More</Button>
    </Col>
  </Row>
);

LoadMore.propTypes = {
  loadMore: PropTypes.func
};

export default LoadMore;
