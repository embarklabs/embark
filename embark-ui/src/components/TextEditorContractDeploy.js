import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {Card, Icon, Button} from 'tabler-react';

const TextEditorContractDeploy = (props) => (
  <Card statusColor="success"
        statusSide
        className="success-card">
    <Card.Header>
      <Card.Title color="success">
        <Icon name="check" className="mr-1" />
        Deploy Contract
      </Card.Title>
    </Card.Header>
    <Card.Body>
      <Button to={`/embark/contracts/${Object.keys(props.result)[0]}/deployment`}
              RootComponent={NavLink}>
        Deploy my contract(s)
      </Button>
    </Card.Body>
  </Card>
);

TextEditorContractDeploy.propTypes = {
  result: PropTypes.object
};

export default TextEditorContractDeploy;
