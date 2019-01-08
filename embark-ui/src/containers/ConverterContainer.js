import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {updateBaseEther} from '../actions';
import {getBaseEther} from "../reducers/selectors";
import Converter from '../components/Converter';
import PageHead from '../components/PageHead';

class ConverterContainer extends React.Component {
  render() {
    return (
      <React.Fragment>
        <PageHead title="Converter" description="A tool that converts a number between the different ether units" />
        <Converter baseEther={this.props.baseEther} updateBaseEther={this.props.updateBaseEther} />
      </React.Fragment>
    );
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
