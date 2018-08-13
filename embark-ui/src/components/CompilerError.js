import React from 'react';
import PropTypes from 'prop-types';
import {Badge} from 'tabler-react';

const CompilerError = ({key, onClick,  errorType, row, errorMessage}) => (
  <a 
    href="#editor"
    className="list-group-item list-group-item-action" 
    onClick={onClick}
    key={key} 
    >
    <Badge color={errorType === "error" ? "danger" : errorType} className="mr-1" key={key}>
      Line {row}
    </Badge>
    {errorMessage}
  </a>
);

CompilerError.propTypes = {
  key: PropTypes.string,
  onClick: PropTypes.func,
  errorType: PropTypes.string,
  row: PropTypes.number,
  errorMessage: PropTypes.string
};

export default CompilerError;
