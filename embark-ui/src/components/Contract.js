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
        <tr>
          <td>{contract.name || contract.className}</td>
          <td>{contract.address || contract.deployedAddress}}</td>
          <td>{contract.deploy.toString()}</td>
        </tr>
      </tbody>
    </table>
  </React.Fragment>
);

export default Contract;

