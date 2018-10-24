import React from 'react';
import PropTypes from 'prop-types';
import {Row, Label, Col, Button} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';
import { AppSwitch } from '@coreui/react'

const TextEditorToolbar = (props) => (
  <Row>
    <Col sm={4} md={2}>
      <Label className="mb-0 pt-1">
        <AppSwitch color='success' variant='pill' size='sm' onChange={props.toggleShowHiddenFiles}/>
        <span className="ml-1 align-top">Show hidden files</span>
      </Label>
    </Col>
    <Col sm={4} md={6}>
      <Button color="success" size="sm" onClick={props.save}>
        <FontAwesomeIcon className="mr-2" name="save"/>
        Save
      </Button>
      <span className="mx-2">|</span>
      <Button color="danger" size="sm" onClick={props.remove}>
        <FontAwesomeIcon className="mr-2" name="trash"/>
        Delete
      </Button>
    </Col>
    <Col sm={4} md={4}>
      <div className="float-right mr-2">
        {props.isContract &&
          <React.Fragment>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('overview')}>
              Overview
            </Button>
            <span className="mx-2">|</span>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('detail')}>
              Detail
            </Button>
            <span className="mx-2">|</span>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('logger')}>
              Logger
            </Button>
            <span className="mx-2">|</span>
            <Button size="sm" color="primary" onClick={() => props.openAsideTab('debugger')}>
              Debugger
            </Button>
          </React.Fragment>
        }
        <Button size="sm" color="primary" onClick={() => props.openAsideTab('browser')}>
          Browser
        </Button>
      </div>
    </Col>
  </Row>
);

TextEditorToolbar.propTypes = {
  isContract: PropTypes.bool,
  save: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func
};

export default TextEditorToolbar;
