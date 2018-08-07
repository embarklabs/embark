import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fetchCodeCompilation} from '../actions';
import Fiddle from '../components/Fiddle';

class FiddleContainer extends Component {
  componentWillMount() {
    
  }


  render() {
    const { compilationResult } = this.props;

    const code = 'hello world';
    console.log('rendering fiddle, compilation result = ' + compilationResult);

    return (
      <React.Fragment>
      <Fiddle onCodeChange={this.props.fetchCodeCompilation} />
        <h2>Result</h2>
        {
          !compilationResult 
          ? 
            'No compilation results yet'
            :
            compilationResult.error 
            ?
              <i>Error API...</i>
              :
              compilationResult
        }
      </React.Fragment>
    );
  }
}
function mapStateToProps(state) {
  return {
    compilationResult: state.compilationResult
  };
}

FiddleContainer.propTypes = {
  compilationResult: PropTypes.object,
  fetchCodeCompilation: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchCodeCompilation
  },
)(FiddleContainer);
