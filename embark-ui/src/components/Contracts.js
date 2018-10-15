import PropTypes from "prop-types";
import React from 'react';
import {Row, Col} from "reactstrap";
import ContractsList from './ContractsList';

const Contracts = ({contracts, title = "Contracts"}) => (
  <Row>
    <Col>
      <h1>{title}</h1>
        <ContractsList contracts={contracts}></ContractsList>
    </Col>
  </Row>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
  title: PropTypes.string
};

export default Contracts;

