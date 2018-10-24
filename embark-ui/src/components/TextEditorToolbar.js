import React from 'react';
import PropTypes from 'prop-types';
import {Row, Label, Col, Button, Nav, NavLink} from 'reactstrap';
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
      <strong>{props.currentFile.name}</strong>
      <span className="mx-2">|</span>
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
      <div className="float-right mr-2 btn-group">
        <Nav>
          {props.isContract &&
            <React.Fragment>
              <NavLink href="#" onClick={() => props.openAsideTab('overview')}>
                <FontAwesomeIcon className="mr-2" name="info-circle" /> Overview
              </NavLink>
              <NavLink href="#" onClick={() => props.openAsideTab('detail')}>
                <FontAwesomeIcon className="mr-2" name="file-text-o" /> Details
              </NavLink>
              <NavLink href="#" onClick={() => props.openAsideTab('logger')}>Logger</NavLink>
            </React.Fragment>
          }
          <NavLink href="#" onClick={() => props.openAsideTab('browser')}>
            <FontAwesomeIcon className="mr-2" name="compass" /> Browser
          </NavLink>
        </Nav>
      </div>
    </Col>
  </Row>
);

TextEditorToolbar.propTypes = {
  currentFile: PropTypes.object,
  isContract: PropTypes.bool,
  save: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func
};

export default TextEditorToolbar;
