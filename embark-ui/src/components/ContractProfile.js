import React from 'react';
import {Link} from 'react-router-dom';

const ContractProfile = ({contract}) => (
  <React.Fragment>
    <h1>Profile for {contract.name}</h1>
    <table>
      <thead>
        <tr>
          <th>Function</th>
          <th>Payable</th>
          <th>Mutability</th>
          <th>Inputs</th>
          <th>Ouputs</th>
          <th>Gas Estimates</th>
        </tr>
      </thead>
      <tbody>
        {contract.methods.map((method) => {
          return (
            <tr>
              <td>{method.name}</td>
              <td>{(method.payable == true).toString()}</td>
              <td>{method.mutability}</td>
              <td>({method.inputs.map((x) => x.type).join(',')})</td>
              <td>({method.outputs.map((x) => x.type).join(',')})</td>
              <td>{method.gasEstimates}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </React.Fragment>
);

export default ContractProfile;

