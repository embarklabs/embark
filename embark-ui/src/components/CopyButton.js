import React from 'react';
import PropTypes from 'prop-types';
import {Badge, Tooltip} from "reactstrap";
import classNames from 'classnames';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import FontAwesome from 'react-fontawesome';
import uuid from 'uuid/v1';

import './CopyButton.css';

class CopyButton extends React.Component {
  constructor(props) {
    super(props);
    this.id = uuid();
    this.state = {
      showCopied: false
    };
  }

  onCopy() {
    if (this.props.onCopy) {
      return this.props.onCopy();
    }
    this.setState({
      showCopied: true
    });
    // Hide the tooltip after 1.5s
    clearTimeout(this.showTimeout);
    this.showTimeout = setTimeout(() => {
      this.setState({showCopied: false});
    }, 1500);
  }

  render() {
    const {text, title, size} = this.props;
    return (<CopyToClipboard text={text}
                             onCopy={() => this.onCopy()}
                             title={title}>
      <Badge className={classNames('copy-to-clipboard', 'p-' + (size || 3))}
             color="primary" id={'copy-button-' + this.id}>
        <FontAwesome name="copy"/>
        {this.state.showCopied &&
        <Tooltip isOpen={true} target={'copy-button-' + this.id}>
          Copied to clipboard
        </Tooltip>}
      </Badge>
    </CopyToClipboard>);
  }
}

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
