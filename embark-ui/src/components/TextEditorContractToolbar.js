import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Col, Badge} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';
import TextEditorToolbar from './TextEditorToolbar';

class TextEditorContractToolbar extends Component {
  render(){
    return (
      <React.Fragment>
        <TextEditorToolbar {...this.props} />
        <Col md={6} className="text-right">
          {this.props.compilingContract &&
            <Badge color="warning"><FontAwesomeIcon name="exclamation-triangle " className="mr-1" />compiling</Badge>}
          {!this.props.compilingContract && this.props.contractCompile.result &&
            <Badge color="success"><FontAwesomeIcon name="check" className="mr-1" />compiled</Badge>}
        </Col>
      </React.Fragment>
    );
  }
}

TextEditorContractToolbar.propTypes = {
  currentFile: PropTypes.object,
  contractCompile: PropTypes.object,
  compilingContract: PropTypes.bool,
  deploy: PropTypes.func,
  save: PropTypes.func,
  remove: PropTypes.func
};

export default TextEditorContractToolbar;
