import React from 'react';
import PropTypes from 'prop-types';
import {Badge} from "reactstrap";
import classNames from 'classnames';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import './CopyButton.css';

const CopyButton = ({text, onCopy, title, size}) => (
  <CopyToClipboard text={text}
                   onCopy={onCopy}
                   title={title}>
    <Badge className={classNames('copy-to-clipboard', 'p-' + (size ? size : 3))}
           color="primary"><i className="fa fa-copy"/></Badge>
  </CopyToClipboard>
);

CopyButton.propTypes = {
  text: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  onCopy: PropTypes.func,
  title: PropTypes.string,
  size: PropTypes.number
};

export default CopyButton;
