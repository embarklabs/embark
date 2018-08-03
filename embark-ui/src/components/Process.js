import React, {Component} from 'react';
import PropTypes from 'prop-types';

class Process extends Component {
  render() {
    const logs = this.props.logs || [];
    return (
      <div>
        State: {this.props.state}
        <div className="logs">
          {
            logs.map((item, i) => <p key={i} className={item.logLevel}>{item.msg_clear || item.msg}</p>)
          }
        </div>
      </div>);
  }
}

Process.propTypes = {
  processName: PropTypes.string.isRequired,
  state: PropTypes.string.isRequired,
  logs: PropTypes.array
};

export default Process;
