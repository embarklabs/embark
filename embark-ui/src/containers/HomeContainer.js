import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";

import {commands as commandsAction} from "../actions";
import DataWrapper from "../components/DataWrapper";
import Processes from '../components/Processes';
import Console from '../components/Console';
import {getProcesses, getCommands} from "../reducers/selectors";

class HomeContainer extends Component {
  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes}) => (
          <Processes processes={processes} />
        )} />
        <Console postCommand={this.props.postCommand} commands={this.props.commands} />
      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object),
  postCommand: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object)
};

function mapStateToProps(state) {
  return {
    processes: getProcesses(state),
    commands: getCommands(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

export default connect(
  mapStateToProps,
  {
    postCommand: commandsAction.post
  }
)(HomeContainer);
