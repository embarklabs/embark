import React from 'react';
import PropTypes from 'prop-types';
import {Badge} from 'tabler-react';

const CompilerError = ({ index, onClick,  errorType, row, errorMessage}) => (
  <a 
    href="#editor"
    className="list-group-item list-group-item-action" 
    onClick={onClick}
    key={index} 
    >
    <Badge color={errorType === "error" ? "danger" : errorType} className="mr-1" key={index}>
      Line {row}
    </Badge>
    {errorMessage}
  </a>
);

CompilerError.propTypes = {
  index: PropTypes.number,
  onClick: PropTypes.func,
  errorType: PropTypes.string,
  row: PropTypes.string,
  errorMessage: PropTypes.string
};

export default CompilerError;
