import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fetchCodeCompilation} from '../actions';
import Fiddle from '../components/Fiddle';

class FiddleContainer extends Component {
  componentWillMount() {
    
  }


  render() {
    const { compilationResult } = this.props;

    const code = 'hello world';

    return (
      <React.Fragment>
      <Fiddle code={code} onCodeChange={this.props.fetchCodeCompilation} />
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
    code: state.code,
    options: state.options
  };
}

export default connect(
  mapStateToProps,
  {
    fetchCodeCompilation
  },
)(FiddleContainer);
