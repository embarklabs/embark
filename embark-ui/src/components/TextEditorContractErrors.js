import React from 'react';
import PropTypes from 'prop-types';
import {Card, Icon, List} from 'tabler-react';

const TextEditorContractErrors = (props) => (
  <Card statusColor="danger"
        statusSide
        className="errors-card">
    <Card.Header>
      <Card.Title color="danger">
        <Icon name="alert-circle" className="mr-1" />
        Failed to compile
      </Card.Title>
    </Card.Header>
    <Card.Body>
      <List.Group>
        {props.errors.map((error, index) => <List.GroupItem key={index}>{error.formattedMessage}</List.GroupItem>)}
      </List.Group>
    </Card.Body>
  </Card>
);

TextEditorContractErrors.propTypes = {
  errors: PropTypes.array
};

export default TextEditorContractErrors;
