import PropTypes from "prop-types";
import React from 'react';
import {
  Row,
  Col
} from 'reactstrap';
import classNames from 'classnames';

const orderClassName = (address) => {
  return classNames({
    badge: true,
    'badge-success': address,
    'badge-secondary': !address
  });
}

const Contract = ({contract}) => (
  <Row className="border-bottom border-primary pb-3 mt-4">
    <Col xs={1} className="text-center">
      <h4><span className={orderClassName(contract.address)}>{contract.index + 1}</span></h4>
    </Col>
    <Col xs={11}>
      {contract.address &&
        <React.Fragment>
          <h5>{contract.className} deployed at {contract.address}</h5>
          <p><strong>Arguments:</strong> {JSON.stringify(contract.args)}</p>
        </React.Fragment>
      }
      {!contract.address &&
        <h5>{contract.className} not deployed</h5>
      }
      {contract.transactionHash &&
        <React.Fragment>
          <p><strong>Transaction Hash:</strong> {contract.transactionHash}</p>
          <p><strong>{contract.gas}</strong> gas at <strong>{contract.gasPrice}</strong> Wei, estimated cost: <strong>{contract.gas * contract.gasPrice}</strong> Wei</p>
        </React.Fragment>
      }
      {contract.address && !contract.transactionHash &&
        <p><strong>Contract already deployed</strong></p>
      }
    </Col>
  </Row>
);

const Contracts = ({contracts}) => (
  <React.Fragment>
    <Row className="mt-3">
      <Col xs={1} className="text-center">
        <strong>Order</strong>
      </Col>
      <Col xs={11}>
        <strong>Contract</strong>
      </Col>
    </Row>
    {contracts.sort((a, b) => a.index - b.index).map(contract => <Contract key={contract.index} contract={contract} />)}
  </React.Fragment>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
};

export default Contracts;

