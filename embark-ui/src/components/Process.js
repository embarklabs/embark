import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {fetchProcessLogs} from "../actions";
import constants from '../constants';
import PropTypes from 'prop-types';

class Process extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: []
    };
    this.gotOriginalLogs = false;
  }

  componentDidMount() {
    const self = this;

    this.props.fetchProcessLogs(self.props.processName);

    this.ws = new WebSocket(constants.wsEndpoint + '/process-logs/' + self.props.processName);

    this.ws.onmessage = function(evt) {
      const log = JSON.parse(evt.data);
      const logs = self.state.logs;
      logs.push(log);
      self.setState({
        logs
      });
    };

    this.ws.onclose = function() {
      console.log(self.props.processName + "Log process connection is closed");
    };

    window.onbeforeunload = function(_event) {
      this.ws.close();
    };
  }

  shouldComponentUpdate(nextProps, _nextState) {
    if (!this.gotOriginalLogs && nextProps.logs && nextProps.logs[this.props.processName]) {
      const logs = nextProps.logs[this.props.processName].concat(this.state.logs);
      this.gotOriginalLogs = true;
      this.setState({
        logs
      });
    }
    return true;
  }

  componentWillUnmount() {
    this.ws.close();
    this.ws = null;
  }

  render() {
    return (
      <div>
        State: {this.props.state}
        <div className="logs">
          {
            this.state.logs.map((item, i) => <p key={i} className={item.logLevel}>{item.msg_clear || item.msg}</p>)
          }
        </div>
      </div>);
  }
}

Process.propTypes = {
  processName: PropTypes.string.isRequired,
  state: PropTypes.string.isRequired,
  fetchProcessLogs: PropTypes.func,
  logs: PropTypes.object
};

function mapStateToProps(state) {
  return {logs: state.processes.logs};
}

export default connect(
  mapStateToProps,
  {
    fetchProcessLogs
  }
)(Process);
