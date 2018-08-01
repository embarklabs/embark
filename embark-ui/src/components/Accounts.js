import React from 'react';

const Accounts = ({accounts}) => (
  <React.Fragment>
    <h1>Accounts</h1>
    <table>
      <thead>
        <tr>
          <th>Address</th>
          <th>Balance</th>
          <th>TX count</th>
          <th>Index</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => {
          return (
            <tr>
              <td>{account.address}</td>
              <td>{account.balance} ETH</td>
              <td>{account.transactionCount}</td>
              <td>{account.index}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </React.Fragment>
);

export default Accounts;
