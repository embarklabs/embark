import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';

const TextEditorContractErrors = (props) => (
  <Card className="bg-danger">
    <CardHeader>
      <CardTitle>
        <FontAwesomeIcon className="mr-1" name="minus-circle"/>
        Failed to compile
      </CardTitle>
    </CardHeader>
    <CardBody>
      <ListGroup>
        {props.errors.map((error, index) => <ListGroupItem key={index}>{error.formattedMessage}</ListGroupItem>)}
      </ListGroup>
    </CardBody>
  </Card>
);

TextEditorContractErrors.propTypes = {
  errors: PropTypes.array
};

export default TextEditorContractErrors;
