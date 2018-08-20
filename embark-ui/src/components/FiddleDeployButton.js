import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Button} from 'tabler-react';

class FiddleDeployButton extends Component{
  
  render (){

    return (
      <Button 
        color="dark"
        size="sm"
        icon="upload-cloud"
        onClick={(e) => this.props.onDeployClick(e)}>
        Deploy
      </Button>
    );
  }
}

FiddleDeployButton.propTypes = {
  fiddle: PropTypes.object,
  onDeployClick: PropTypes.func,
  loading: PropTypes.bool,
  compiledContract: PropTypes.object,
  error: PropTypes.string
};

export default FiddleDeployButton;
