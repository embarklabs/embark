import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";

import {commands as commandsAction, listenToProcessLogs, processLogs as processLogsAction, stopProcessLogs} from "../actions";
import DataWrapper from "../components/DataWrapper";
import Processes from '../components/Processes';
import Console from '../components/Console';
import {getProcesses, getCommands, getProcessLogs} from "../reducers/selectors";

const EMBARK_PROCESS_NAME = 'embark';
const LOG_LIMIT = 50;

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { activeProcess: EMBARK_PROCESS_NAME };
  }

  componentDidMount() {
    this.updateTab();
  }

  isEmbark() {
    return this.state.activeProcess === EMBARK_PROCESS_NAME
  }

  updateTab(processName = EMBARK_PROCESS_NAME) {
    if (!this.isEmbark()){
      this.props.stopProcessLogs(this.state.activeProcess)
    }

    this.props.fetchProcessLogs(processName, LOG_LIMIT);
    if (processName !== EMBARK_PROCESS_NAME) {
      this.props.listenToProcessLogs(processName);
    }

    this.setState({activeProcess: processName});
  }

  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes}) => (
          <Processes processes={processes} />
        )} />

        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes, postCommand, processLogs}) => (
          <Console activeProcess={this.state.activeProcess}
                   postCommand={postCommand}
                   commands={this.props.commands}
                   processes={processes}
                   processLogs={processLogs}
                   isEmbark={() => this.isEmbark}
                   updateTab={processName => this.updateTab(processName)} />
        )} />
      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object),
  postCommand: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.string,
  loading: PropTypes.bool
};

function mapStateToProps(state) {
  return {
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
    listenToProcessLogs,
    stopProcessLogs
  }
)(HomeContainer);
