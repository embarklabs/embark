import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Card, CardHeader, CardBody} from "reactstrap";
import {Link} from 'react-router-dom';
import {formatContractForDisplay} from '../utils/presentation';

import CardTitleIdenticon from './CardTitleIdenticon';

const Contracts = ({contracts, title = "Contracts"}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>{title}</h2>
        </CardHeader>
        <CardBody>
          {
            contracts.map(contract => {
              const contractDisplay = formatContractForDisplay(contract);

              return (
                <div className="explorer-row border-top" key={contract.address}>
                  <CardTitleIdenticon id={contract.className}>
                    <Link to={`/explorer/contracts/${contract.className}`}>{contract.className}</Link>
                  </CardTitleIdenticon>
                  <Row>
                    <Col>
                      <strong>Address</strong>
                      <div>{contract.address}</div>
                    </Col>
                    <Col>
                      <strong>State</strong>
                      <div className={contractDisplay.stateColor}>
                        {formatContractForDisplay(contract).state}
                      </div>
                    </Col>
                  </Row>
                </div>
              )
            })
          }
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
