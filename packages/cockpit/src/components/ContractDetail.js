import PropTypes from "prop-types";
import React from 'react';
import ReactJson from "react-json-view";
import {Row, Col} from "reactstrap";
import CopyButton from './CopyButton';

const ContractDetail = ({contract}) => {
  return (
    <Row>
      <Col>
        <strong>ABI</strong>
        <div className="relative">
          <CopyButton text={JSON.stringify(contract.abiDefinition)}
                      title="Copy bytecode to clipboard"/>
          {contract.abiDefinition && <ReactJson src={contract.abiDefinition} theme="monokai" sortKeys={true} collapsed={1} />}
        </div>
        <br />
        <strong>Bytecode</strong>
        <div className="text-wrap logs relative">
          <CopyButton text={contract.runtimeBytecode}
                      title="Copy bytecode to clipboard"/>
          {contract.runtimeBytecode}
        </div>
      </Col>
    </Row>
  );
};

ContractDetail.propTypes = {
  contract: PropTypes.object
};

export default ContractDetail;
