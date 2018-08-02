import React, {Component} from 'react';
import {Tab} from "tabler-react";
import constants from '../constants';
import PropTypes from 'prop-types';

class Process extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs: []
    };
  }

  componentDidMount() {
    const self = this;
    this.ws = new WebSocket(constants.wsEndpoint + 'process-logs/' + self.props.processName);

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
            this.state.logs.map((item, i) => <p key={i} className={item.logLevel}>{item.msg}</p>)
          }
        </div>
      </div>);
  }
}

Process.propTypes = {
  processName: PropTypes.string,
  state: PropTypes.string
};

export default Process;
