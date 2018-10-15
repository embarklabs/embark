import React from 'react';
import {Row, Col, Table} from 'reactstrap';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

const Accounts = ({accounts}) => (
  <Row>
    <Col>
      <h1>Accounts</h1>
      <Table responsive className="text-nowrap">
        <thead>
          <tr>
            <th>Address</th>
            <th>Balance</th>
            <th>TX count</th>
            <th>Index</th>
          </tr>
        </thead>
        <tbody>
          {
            accounts.map((account) => {
              return (
                <tr key={account.address}>
                  <td><Link to={`/embark/explorer/accounts/${account.address}`}>{account.address}</Link></td>
                  <td>{account.balance}</td>
                  <td>{account.transactionCount}</td>
                  <td>{account.index}</td>
                </tr>
              );
            })
          }
        </tbody>
      </Table>
    </Col>
  </Row>
);

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object)
};

export default Accounts;
