import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";
import {commands as commandsAction} from "../actions";

import Processes from '../components/Processes';
import Console from '../components/Console';

class HomeContainer extends Component {
  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        {this.props.processes.data && <Processes processes={this.props.processes.data} />}
        <Console postCommand={this.props.postCommand} commandResults={this.props.commandResults} />
      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.object,
  postCommand: PropTypes.func,
  commandResults: PropTypes.arrayOf(PropTypes.string)
};

function mapStateToProps(state) {
  return {processes: state.processes, commandResults: state.commands.results};
}

export default connect(
  mapStateToProps,
  {
    postCommand: commandsAction.post
  }
)(HomeContainer);
