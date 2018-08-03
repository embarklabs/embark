import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fetchProcessLogs, listenToProcessLogs} from '../actions';

import Process from "../components/Process";

class ProcessesContainer extends Component {
  componentDidMount() {
    // Get correct process name
    const pathParts = this.props.match.path.split('/');
    this.processName = pathParts[pathParts.length - 1];
    // If we are not in a specific process page (eg: processes/ root), get first process
    if (Object.keys(this.props.processes.data).indexOf(this.processName) < 0) {
      this.processName = Object.keys(this.props.processes.data)[0];
    }

    // Fetch logs for the process
    this.props.fetchProcessLogs(this.processName);

    // Only start watching if we are not already watching
    if (!this.props.processes.data[this.processName].isListening) {
      this.props.listenToProcessLogs(this.processName);
    }
  }

  render() {
    if (!this.processName) {
      return '';
    }
    return (
      <div className="processes-container">
        <Process processName={this.processName}
                 state={this.props.processes.data[this.processName].state}
                 logs={this.props.processes.data[this.processName].logs}/>
      </div>
    );
  }
}

ProcessesContainer.propTypes = {
  match: PropTypes.object,
  processes: PropTypes.object,
  fetchProcessLogs: PropTypes.func,
  listenToProcessLogs: PropTypes.func
};

function mapStateToProps(state) {
  return {processes: state.processes};
}

export default connect(
  mapStateToProps,
  {
    fetchProcessLogs,
    listenToProcessLogs
  }
)(ProcessesContainer);
