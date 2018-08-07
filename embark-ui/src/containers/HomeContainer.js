import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";

import Processes from '../components/Processes';
import Console from '../components/Console';

class HomeContainer extends Component {
  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        {this.props.processes.data && <Processes processes={this.props.processes.data} />}
        <Console />
      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.object
};

function mapStateToProps(state) {
  return {processes: state.processes};
}

export default connect(
  mapStateToProps,
  null,
)(HomeContainer);
