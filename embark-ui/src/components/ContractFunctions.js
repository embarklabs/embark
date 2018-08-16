import PropTypes from "prop-types";
import React from 'react';
import {
  Page,
  Grid,
  Form,
  Button,
  Card
} from "tabler-react";

const ContractFunction = ({method}) => (
  <Grid.Row>
    <Grid.Col>
      <Card>
        <Card.Header>
          <Card.Title>{method.name}</Card.Title>
        </Card.Header>
        {method.inputs.length > 0 &&
          <Card.Body>
            {method.inputs.map(input => (
              <Form.Group key={input.name} label={input.name}>
                <Form.Input placeholder={input.type}/>
              </Form.Group>
            ))}
          </Card.Body>
        }
        <Card.Footer>
          <Button color="primary">Call</Button>
        </Card.Footer>
      </Card>
    </Grid.Col>
  </Grid.Row>
);

ContractFunction.propTypes = {
  method: PropTypes.object
};

const ContractFunctions = ({contractProfile}) => (
  <Page.Content title={contractProfile.name + ' Functions'}>
    {contractProfile.methods
      .filter(method => method.name !== 'constructor')
      .map(method => <ContractFunction key={method.name} method={method} />)}
  </Page.Content>
);

ContractFunctions.propTypes = {
  contractProfile: PropTypes.object
};

export default ContractFunctions;

