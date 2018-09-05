import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";

import {commands as commandsAction, listenToProcessLogs, processLogs as processLogsAction} from "../actions";
import DataWrapper from "../components/DataWrapper";
import Processes from '../components/Processes';
import Versions from '../components/Versions';
import Console from '../components/Console';
import {getProcesses, getCommands, getVersions, getProcessLogs} from "../reducers/selectors";

class HomeContainer extends Component {
  componentDidMount() {
    if (this.props.processLogs.length === 0) {
      // TODO get all
      this.props.fetchProcessLogs('blockchain');
      this.props.fetchProcessLogs('ipfs');
      this.props.listenToProcessLogs('blockchain');
    }
  }

  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes}) => (
          <Processes processes={processes} />
        )} />
        <DataWrapper shouldRender={this.props.versions.length > 0 } {...this.props} render={({versions}) => (
          <Versions versions={versions} />
        )} />

        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes, postCommand, processLogs}) => (
          <Console postCommand={postCommand} commands={this.props.commands} processes={processes} processLogs={processLogs} />
        )} />
      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object),
  versions: PropTypes.arrayOf(PropTypes.object),
  postCommand: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.string,
  loading: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    versions: getVersions(state),
    processes: getProcesses(state),
    commands: getCommands(state),
    error: state.errorMessage,
    processLogs: getProcessLogs(state),
    loading: state.loading
  };
}

export default connect(
  mapStateToProps,
  {
    postCommand: commandsAction.post,
    fetchProcessLogs: processLogsAction.request,
    listenToProcessLogs
  }
)(HomeContainer);
