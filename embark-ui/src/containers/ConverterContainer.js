import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {updateBaseEther} from '../actions';
import {getBaseEther} from "../reducers/selectors";
import Converter from '../components/Converter';

class ConverterContainer extends React.Component {
  render() {
    return <Converter baseEther={this.props.baseEther}
                      updateBaseEther={this.props.updateBaseEther} />;
  }
}

function mapStateToProps(state) {
  return {
    baseEther: getBaseEther(state)
  };
}

ConverterContainer.propTypes = {
  baseEther: PropTypes.string,
  updateBaseEther: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    updateBaseEther
  }
)(ConverterContainer);
