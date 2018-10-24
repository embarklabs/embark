import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import CardTitleIdenticon from './CardTitleIdenticon';
import LoadMore from "./LoadMore";

const Transactions = ({transactions, showLoadMore, loadMore}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h1>Transactions</h1>
        </CardHeader>
        <CardBody>
          {transactions.map(transaction => (
            <div className="explorer-row" key={transaction.hash}>
              <CardTitleIdenticon id={transaction.hash}>Transaction&nbsp;
                <Link to={`/embark/explorer/transactions/${transaction.hash}`}>
                  {transaction.hash}
                </Link>
              </CardTitleIdenticon>
              <Row>
                <Col>
                  <strong>Block number</strong>
                  <div>{transaction.blockNumber}</div>
                </Col>
                <Col>
                  <strong>From</strong>
                  <div>{transaction.from}</div>
                </Col>
                <Col>
                  <strong>To</strong>
                  <div>{transaction.to}</div>
                </Col>
                <Col>
                  <strong>Type</strong>
                  <div>{transaction.to ? "Contract Call" : "Contract Creation"}</div>
                </Col>
              </Row>
            </div>
          ))}
          {showLoadMore && <LoadMore loadMore={() => loadMore()} />}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Transactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  showLoadMore: PropTypes.bool,
  loadMore: PropTypes.func
};

export default Transactions;
