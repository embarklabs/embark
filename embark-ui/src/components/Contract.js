import React from 'react';
import {Link} from 'react-router-dom';

const Contract = ({contract}) => (
  <React.Fragment>
    <h1>Contract</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>State</th>
        </tr>
      </thead>
      <tbody>
        return (
          <tr>
            <td>{contract.name}</td>
            <td>{contract.address}</td>
            <td>{contract.deploy}</td>
          </tr>
        )
      </tbody>
    </table>
  </React.Fragment>
);

export default Contract;

