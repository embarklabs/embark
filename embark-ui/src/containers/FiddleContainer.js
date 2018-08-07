import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fetchCodeCompilation} from '../actions';
import Fiddle from '../components/Fiddle';

class FiddleContainer extends Component {

  constructor(props){
    super(props)
    this.state = { value: ''};
  }

  onCodeChange(newValue) {
    this.setState({value: newValue});
    this.props.fetchCodeCompilation(newValue);
  }

  render() {
    const { fiddles } = this.props;

    return (
      <React.Fragment>
        <Fiddle value={this.state.value} onCodeChange={(n) => this.onCodeChange(n)} />
        <h2>Result</h2>
        <p>{ fiddles.data ? JSON.stringify(fiddles.data) : 'No compilation results yet'}</p>
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
