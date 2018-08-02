import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tabs, Tab} from 'tabler-react';
import PropTypes from 'prop-types';

import {fetchProcesses} from '../actions';
import Loading from '../components/Loading';

import "./css/processContainer.css";
import Process from "../components/Process";

class ProcessesContainer extends Component {
  componentDidMount() {
    this.props.fetchProcesses();
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
              <Process processName={processName} state={processes.data[processName].state}/>
            </Tab>);
          })}
        </Tabs>}

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
