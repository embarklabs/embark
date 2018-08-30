import React from 'react';
import PropTypes from 'prop-types';
import {Card, Icon, List} from 'tabler-react';

const TextEditorContractWarnings = (props) => (
  <Card statusColor="warning"
        statusSide
        className="warnings-card">
    <Card.Header>
      <Card.Title color="warning">
        <Icon name="alert-triangle" className="mr-1" />
        Warning during compilation
      </Card.Title>
    </Card.Header>
    <Card.Body>
      <List.Group>
        {props.warnings.map((warning, index) => <List.GroupItem key={index}>{warning.formattedMessage}</List.GroupItem>)}
      </List.Group>
    </Card.Body>
  </Card>
);

TextEditorContractWarnings.propTypes = {
  warnings: PropTypes.array
};

export default TextEditorContractWarnings;
