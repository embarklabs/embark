import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Table} from "reactstrap";
import JSONTree from 'react-json-tree';
import {formatContractForDisplay} from '../utils/presentation';

const Contract = ({contract, match}) => {
  const contractDisplay = formatContractForDisplay(contract);
  return (
    <Row>
      <Col>
        <h1>{contract.className} Overview</h1>
        <Table
          responsive
          className="text-nowrap"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            <tr className={contractDisplay.stateColor}>
              <td>{contract.className}</td>
              <td>{contractDisplay.address}</td>
              <td>{contractDisplay.state}</td>
            </tr>
          </tbody>
        </Table>
        <h2>ABI</h2>
        <div>
          {contract.abiDefinition && <JSONTree data={contract.abiDefinition} />}
        </div>
        <h2>Bytecode</h2>
        <div className="text-wrap">
          {contract.runtimeBytecode}
        </div>
      </Col>
    </Row>
  );
};

Contract.propTypes = {
  contract: PropTypes.object,
};

export default Contract;

