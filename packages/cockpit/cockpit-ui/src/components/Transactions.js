import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';
import {formatTimestampForDisplay} from '../utils/presentation';

import DebugButton from './DebugButton';
import CardTitleIdenticon from './CardTitleIdenticon';
import Pagination from "./Pagination";


const Transactions = ({transactions, contracts, changePage, currentPage, numberOfPages}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>Transactions</h2>
        </CardHeader>
        <CardBody>
          {!transactions.length && "No transactions to display"}
          {transactions.map(transaction => (
            <div className="explorer-row border-top" key={transaction.hash}>
              <CardTitleIdenticon id={transaction.hash}>Transaction&nbsp;
                <Link to={`/explorer/transactions/${transaction.hash}`}>
                  {transaction.hash}
                </Link>
              </CardTitleIdenticon>
              <Row>
                <Col>
                  <DebugButton transaction={transaction} contracts={contracts} />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Block number</strong>
                  <div>{transaction.blockNumber}</div>
                </Col>
                <Col md={6}>
                  <strong>From</strong>
                  <div>{transaction.from}</div>
                </Col>
                <Col md={6}>
                  <strong>To</strong>
                  <div>{transaction.to}</div>
                </Col>
                <Col md={6}>
                  <strong>Type</strong>
                  <div>{transaction.to ? "Contract Call" : "Contract Creation"}</div>
                </Col>
                <Col md={6}>
                  <strong>Mined on:</strong>
                  <div>{formatTimestampForDisplay(transaction.timestamp)}</div>
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

Transactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  contracts: PropTypes.arrayOf(PropTypes.object),
  changePage: PropTypes.func,
  currentPage: PropTypes.number,
  numberOfPages: PropTypes.number
};

export default Transactions;
