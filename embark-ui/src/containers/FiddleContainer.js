/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fetchCodeCompilation} from '../actions';
import Fiddle from '../components/Fiddle';
import FiddleResults from '../components/FiddleResults';

class FiddleContainer extends Component {

  constructor(props){
    super(props);
    this.state = { 
      value: ''
    };
    this.compileTimeout = null;
  }

  componentDidMount(){
    if(this.state.value){
      this.props.fetchCodeCompilation(this.state.value);
    }
  }

  onCodeChange(newValue) {
    this.setState({value: newValue});
    if(this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.props.fetchCodeCompilation(newValue);
    }, 1000);
    
  }

  render() {
    const {fiddles} = this.props;
    
    let renderings = [<Fiddle key="0" value={this.state.value} onCodeChange={(n) => this.onCodeChange(n)} />];
    if(fiddles.compilationResult) {
      renderings.push(<FiddleResults key="1" compilationResult={fiddles.compilationResult}/>);
    }
    else renderings.push('Nothing to compile');
    
    return (
       <React.Fragment>
        {renderings}
      </React.Fragment>
    );
  }
}
function mapStateToProps(state) {
  return {
    fiddles: state.fiddles
  };
}

FiddleContainer.propTypes = {
  fiddles: PropTypes.object,
  fetchCodeCompilation: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchCodeCompilation
  },
)(FiddleContainer);
