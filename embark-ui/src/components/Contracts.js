import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Card, CardBody, CardTitle} from "reactstrap";
import ContractsList from './ContractsList';

const Contracts = ({contracts, title = "Contracts"}) => (
  <Row>
    <Col className="mt-3">
      <Card>
        <CardBody>
          <Row>
            <Col sm="5">
              <CardTitle className="mb-0">Contracts</CardTitle>
            </Col>
          </Row>
          <div className="mt-5">
           <ContractsList contracts={contracts}></ContractsList>
          </div>
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
  title: PropTypes.string
};

export default Contracts;

