import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {processLogs as processLogsAction, listenToProcessLogs} from '../actions';
import DataWrapper from "../components/DataWrapper";
import Process from "../components/Process";
import {getProcess, getProcessLogsByProcess} from "../reducers/selectors";

class ProcessContainer extends Component {
  componentDidMount() {
    if (this.props.process.state === 'running' && this.props.processLogs.length === 0) {
      this.props.fetchProcessLogs(this.props.match.params.processName);
      this.props.listenToProcessLogs(this.props.match.params.processName);
    }
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.process !== undefined } {...this.props} render={({process, processLogs}) => (
        <div className="processes-container">
          <Process process={process}
                   processLogs={processLogs}/>
        </div>
      )} />
    );
  }
}

ProcessContainer.propTypes = {
  fetchProcessLogs: PropTypes.func,
  listenToProcessLogs: PropTypes.func,
  process: PropTypes.object,
  processLogs: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.string,
  loading: PropTypes.bool,
  match: PropTypes.object
};

function mapStateToProps(state, props) {
  return {
    process: getProcess(state, props.match.params.processName),
    processLogs: getProcessLogsByProcess(state, props.match.params.processName),
    error: state.errorMessage,
    loading: state.loading
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    fetchProcessLogs: processLogsAction.request,
    listenToProcessLogs
  }
)(ProcessContainer));
