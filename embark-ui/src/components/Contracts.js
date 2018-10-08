import PropTypes from "prop-types";
import React from 'react';
import {Page, Grid} from "tabler-react";
import ContractsList from './ContractsList';

const Contracts = ({contracts, title = "Contracts"}) => (
  <Page.Content title={title}>
    <Grid.Row>
      <Grid.Col>
        <ContractsList contracts={contracts}></ContractsList>
      </Grid.Col>
    </Grid.Row>
  </Page.Content>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
  title: PropTypes.string
};

export default Contracts;

