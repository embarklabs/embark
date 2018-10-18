import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardHeader, CardBody, CardTitle, ListGroup, ListGroupItem} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';

const TextEditorContractWarnings = (props) => (
  <Card className="bg-warning">
    <CardHeader>
      <CardTitle color="warning">
        <FontAwesomeIcon className="mr-1" name="exclamation-triangle"/>
        Warning during compilation
      </CardTitle>
    </CardHeader>
    <CardBody>
      <ListGroup>
        {props.warnings.map((warning, index) => <ListGroupItem key={index}>{warning.formattedMessage}</ListGroupItem>)}
      </ListGroup>
    </CardBody>
  </Card>
);

TextEditorContractWarnings.propTypes = {
  warnings: PropTypes.array
};

export default TextEditorContractWarnings;
