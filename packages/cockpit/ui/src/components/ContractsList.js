import React from 'react';
import {Table} from "reactstrap";
import {Link} from 'react-router-dom';
import PropTypes from "prop-types";
import Pagination from './Pagination';
import {formatContractForDisplay} from '../utils/presentation';

const ContractsList = ({contracts, changePage, currentPage, numberOfPages}) => (
  <React.Fragment>
    {!contracts.length && "No contracts to display"}
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
          contracts
            .map((contract) => {
              if (!contract) {
                return null;
              }
              const contractDisplay = formatContractForDisplay(contract);
              return (
                <tr key={contractDisplay.name} className={contractDisplay.stateColor}>
                  <td><Link to={`/explorer/contracts/${contractDisplay.name}`}>{contractDisplay.name}</Link></td>
                  <td>{contractDisplay.address}</td>
                  <td>{contractDisplay.state}</td>
                </tr>
              );
            })
        }
      </tbody>
    </Table>
    {numberOfPages > 1 && <Pagination changePage={changePage} currentPage={currentPage} numberOfPages={numberOfPages}/>}
  </React.Fragment>
);

ContractsList.propTypes = {
  contracts: PropTypes.array,
  changePage: PropTypes.func,
  currentPage: PropTypes.number,
  numberOfPages: PropTypes.number
};

export default ContractsList;
