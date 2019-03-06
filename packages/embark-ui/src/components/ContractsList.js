import PropTypes from "prop-types";
import React from 'react';
import {Table} from "reactstrap";
import {Link} from 'react-router-dom';
import {formatContractForDisplay} from '../utils/presentation';

const ContractsList = ({contracts}) => (
  <Table hover responsive className="table-outline mb-0 d-none d-sm-table text-nowrap">
    <thead className="thead-light">
      <tr>
        <th>Name</th>
        <th>Address</th>
        <th>State</th>
      </tr>
    </thead>
    <tbody>
      {
        contracts.map((contract) => {
          const contractDisplay = formatContractForDisplay(contract);
          if (!contractDisplay) {
            return null;
          }
          return (
            <tr key={contract.className} className={contractDisplay.stateColor}>
              <td><Link to={`/explorer/contracts/${contract.className}`}>{contract.className}</Link></td>
              <td>{contractDisplay.address}</td>
              <td>{contractDisplay.state}</td>
            </tr>
          );
        })
      }
    </tbody>
  </Table>
)

ContractsList.propTypes = {
  contracts: PropTypes.array,
};

export default ContractsList;
