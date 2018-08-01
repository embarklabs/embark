import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fetchProcesses} from '../actions';
import {Tabs, Tab} from 'tabler-react';
import PropTypes from 'prop-types';

import "./css/processContainer.css";

class ProcessesContainer extends Component {
  componentDidMount() {
    this.props.fetchProcesses();
  }

  render() {
    const {processes} = this.props;
    if (!processes.data) {
      return (
        <h1>
          <i>Loading processes...</i>
        </h1>
      );
    }

    if (processes.error) {
      return (
        <h1>
          <i>Error loading processes: {processes.error.message || processes.error}</i>
        </h1>
      );
    }

    const processNames = Object.keys(processes.data);
    return (
      <div className="processes-container">
        <Tabs initialTab={processNames[0]}>
          {processNames.map(processName => {
            return (<Tab key={processName} title={processName}>State: {processes.data[processName].state}</Tab>);
          })}
        </Tabs>
      </div>
    );
  }
}

ProcessesContainer.propTypes = {
  processes: PropTypes.object,
  fetchProcesses: PropTypes.func
};

function mapStateToProps(state) {
  return {processes: state.processes};
}

export default connect(
  mapStateToProps,
  {
    fetchProcesses
  }
)(ProcessesContainer);
