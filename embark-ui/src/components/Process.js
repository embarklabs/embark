import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Page} from "tabler-react";
import Loading from "./Loading";

class Process extends Component {
  render() {
    const logs = this.props.logs;
    return (
      <Page.Content className="text-capitalize" title={this.props.processName}>
        <p className="text-capitalize">State: {this.props.state}</p>
        {!logs &&
        <Loading/>}
        {logs &&
        <div className="logs">
          {
            logs.map((item, i) => <p key={i} className={item.logLevel}>{item.msg_clear || item.msg}</p>)
          }
        </div>}
      </Page.Content>);
  }
}

Process.propTypes = {
  processName: PropTypes.string.isRequired,
  state: PropTypes.string.isRequired,
  logs: PropTypes.array
};

export default Process;
