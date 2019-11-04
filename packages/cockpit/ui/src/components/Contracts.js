import React from 'react';
import {Row, Col, Card, CardHeader, CardBody} from "reactstrap";
import {Link} from 'react-router-dom';
import PropTypes from "prop-types";
import Pagination from './Pagination';
import {formatContractForDisplay} from '../utils/presentation';

import CardTitleIdenticon from './CardTitleIdenticon';

const Contracts = ({contracts, changePage, currentPage, numberOfPages, title = "Contracts"}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <h2>{title}</h2>
        </CardHeader>
        <CardBody>
          {!contracts.length && "No contracts to display"}
          {contracts
           .map((contract, key) => {
              if (!contract) {
                return null;
              }
              const contractDisplay = formatContractForDisplay(contract);
              return (
                <div className="explorer-row border-top" key={`contract-${key}`}>
                  <CardTitleIdenticon id={contractDisplay.name}>
                    <Link to={`/explorer/contracts/${contractDisplay.name}`}>
                      {contractDisplay.name}
                    </Link>
                  </CardTitleIdenticon>
                  <Row>
                    <Col>
                      <strong>Address</strong>
                      <div>{contractDisplay.address}</div>
                    </Col>
                    <Col>
                      <strong>State</strong>
                      <div className={contractDisplay.stateColor}>
                        {contractDisplay.state}
                      </div>
                    </Col>
                  </Row>
                </div>
              )
          })}
          {numberOfPages > 1 && <Pagination changePage={changePage} currentPage={currentPage} numberOfPages={numberOfPages}/>}
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
  changePage: PropTypes.func,
  currentPage: PropTypes.number,
  numberOfPages: PropTypes.number,
  title: PropTypes.string
};

export default Contracts;
