import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Table} from 'reactstrap';
import PropTypes from 'prop-types';

const Transactions = ({transactions}) => (
  <Row>
    <Col>
      <h1>Transactions</h1>
      <Table responsive className="text-nowrap">
        <thead>
          <tr>
            <th>Hash</th>
            <th>Block Number</th>
            <th>From</th>
            <th>To</th>
            <th>Type</th>
          </tr>
        </thead>
      <tbody>
        {
          transactions.map((transaction) => {
            return (
              <tr key={transaction.hash}>
                <td><Link to={`/embark/explorer/transactions/${transaction.hash}`}>{transaction.hash}</Link></td>
                <td>{transaction.blockNumber}</td>
                <td>{transaction.from}</td>
                <td>{transaction.to}</td>
                <td>{transaction.to ? "Contract Call" : "Contract Creation"}</td>
              </tr>
            );
          })
        }
      </tbody>
    </Table>
    </Col>
  </Row>
);

Transactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object)
};

export default Transactions;
