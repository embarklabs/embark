import PropTypes from "prop-types";
import React from 'react';
import autoscroll from 'autoscroll-react';

import "./Logs.css";

const Logs = (props) =>  (
  <div className="logs" {...props}>
    {props.children}
  </div>
);

Logs.propTypes = {
  children: PropTypes.object
};

export default autoscroll(Logs);
