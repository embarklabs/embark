import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Button} from 'tabler-react';
import {fiddleDeploy as fiddleDeployAction} from '../actions';
import {connect} from 'react-redux';
import {getFiddle} from '../reducers/selectors';

class FiddleDeployButton extends Component{
  
  handleClick(){
    this.props.postFiddleDeploy(this.props.fiddle);
  }
  render (){

    return (
      <Button 
        color="success"
        onClick={(e) => this.handleClick(e)}>
        Deploy
      </Button>
    );
  }
}

function mapStateToProps(state) {
  return { 
    fiddle: getFiddle(state),
    error: state.errorMessage, 
    loading: state.loading,
    compiledContract: state.compiledContract
  };
}

FiddleDeployButton.propTypes = {
  fiddle: PropTypes.object,
  postFiddleDeploy: PropTypes.func,
  loading: PropTypes.bool,
  compiledContract: PropTypes.object,
  error: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    postFiddleDeploy: fiddleDeployAction.request
  },
)(FiddleDeployButton);
