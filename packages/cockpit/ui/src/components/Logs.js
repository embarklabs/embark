import PropTypes from "prop-types";
import React from 'react';
import autoscroll from 'autoscroll-react';

import "./Logs.css";

// This NEEDS to be a component because of autoscroll
class Logs extends React.Component {
  render() {
    return (
      <div className="logs" {...this.props}>
        {this.props.children}
      </div>
    );
  }
}

Logs.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ])
};

export default autoscroll(Logs);
