import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {updateEtherConversions, initEtherConversions} from '../actions';
import {getEtherConversions} from "../reducers/selectors";
import Converter from '../components/Converter';

class ConverterContainer extends React.Component {
  componentDidMount() {
    if(this.props.etherConversions.length === 0) {
      this.props.initEtherConversions();
    }
  }

  render() {
    return <Converter etherConversions={this.props.etherConversions}
                      updateEtherConversions={this.props.updateEtherConversions} />;
  }
}

function mapStateToProps(state) {
  return {
    etherConversions: getEtherConversions(state)
  };
}

ConverterContainer.propTypes = {
  etherConversions: PropTypes.arrayOf(PropTypes.object),
  updateEtherConversions: PropTypes.func,
  initEtherConversions: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    updateEtherConversions,
    initEtherConversions
  }
)(ConverterContainer);
