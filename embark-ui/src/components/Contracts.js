import React from 'react';
import {Link} from 'react-router-dom';

const Contracts = ({contracts}) => (
  <React.Fragment>
    <h1>Contracts</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Address</th>
          <th>State</th>
        </tr>
      </thead>
      <tbody>
        {contracts.map((contract) => {
          return (
            <tr>
              <td><Link to={`contracts/${contract.name}`}>{contract.name}</Link></td>
              <td>{contract.address}</td>
              <td>{contract.deploy}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </React.Fragment>
);

export default Contracts;

