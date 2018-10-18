import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Table} from "reactstrap";
import JSONTree from 'react-json-tree';
import GasStationContainer from "../containers/GasStationContainer";
import {formatContractForDisplay} from '../utils/presentation';
import CopyButton from './CopyButton';

const Contract = ({contract}) => {
  const contractDisplay = formatContractForDisplay(contract);
  return (
    <Row>
      <Col>
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
        <div className="relative">
          <CopyButton text={contract.runtimeBytecode}
                      title="Copy bytecode to clipboard"/>
          {contract.abiDefinition && <JSONTree data={contract.abiDefinition}/>}
        </div>
        <h2>Bytecode</h2>
        <div className="text-wrap logs relative">
          <CopyButton text={contract.runtimeBytecode}
                      title="Copy bytecode to clipboard"/>
          {contract.runtimeBytecode}
        </div>
        <GasStationContainer/>
      </Col>
    </Row>
  );
};

Contract.propTypes = {
  contract: PropTypes.object
};

export default Contract;

