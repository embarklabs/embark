import React from 'react';
import PropTypes from 'prop-types';
import {Button} from 'tabler-react';

const FiddleDeployButton = ({ onDeployClick }) => (
  <Button 
    color="dark"
    size="sm"
    icon="upload-cloud"
    onClick={onDeployClick}>
    Deploy
  </Button>
);

FiddleDeployButton.propTypes = {
  onDeployClick: PropTypes.func.isRequired
};

export default FiddleDeployButton;
