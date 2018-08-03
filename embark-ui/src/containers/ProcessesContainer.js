import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tabs, Tab} from 'tabler-react';
import PropTypes from 'prop-types';
import {fetchProcesses, fetchProcessLogs, listenToProcessLogs} from '../actions';
import Loading from '../components/Loading';

import "./css/processContainer.css";
import Process from "../components/Process";

class ProcessesContainer extends Component {
  componentDidMount() {
    this.props.fetchProcesses();
  }

  shouldComponentUpdate(nextProps, _nextState) {
    if (!this.islistening && nextProps.processes && nextProps.processes.data) {
      this.islistening = true;
      Object.keys(nextProps.processes.data).forEach(processName => {
        this.props.fetchProcessLogs(processName);
        // Only start watching if we are not already watching
        if (!this.props.processes.data ||
          !this.props.processes.data[processName] ||
          !this.props.processes.data[processName].isListening
        ) {
          this.props.listenToProcessLogs(processName);
        }
      });
    }
    return true;
  }

  render() {
    const {processes} = this.props;
    if (!processes.data) {
      return <Loading />;
    }

    const processNames = Object.keys(processes.data);
    return (
      <div className="processes-container">
        {processes.error && <h1>
          <i>Error: {processes.error.message || processes.error}</i>
        </h1>}

        {processNames && processNames.length && <Tabs initialTab={processNames[0]}>
          {processNames.map(processName => {
            return (<Tab key={processName} title={processName}>
              <Process processName={processName}
                       state={processes.data[processName].state}
                       logs={processes.data[processName].logs}/>
            </Tab>);
          })}
        </Tabs>}

      </div>
    );
  }
}

ProcessesContainer.propTypes = {
  processes: PropTypes.object,
  fetchProcesses: PropTypes.func,
  fetchProcessLogs: PropTypes.func,
  listenToProcessLogs: PropTypes.func
};

function mapStateToProps(state) {
  return {processes: state.processes};
}

export default connect(
  mapStateToProps,
  {
    fetchProcesses,
    fetchProcessLogs,
    listenToProcessLogs
  }
)(ProcessesContainer);
