import PropTypes from "prop-types";
import React from 'react';
import autoscroll from 'autoscroll-react';

import "./Logs.css";

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
  children: PropTypes.object
};

export default autoscroll(Logs);
