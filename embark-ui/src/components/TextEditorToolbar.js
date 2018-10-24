import React from 'react';
import PropTypes from 'prop-types';
import {Button, Nav, NavLink} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';

const TextEditorToolbar = (props) => (
  <ol className="breadcrumb">
    <li className="breadcrumb-item">
      {props.currentFile.name}
    </li>
    <li className="breadcrumb-item">
      <Button color="success" size="sm" onClick={props.save}>
        <FontAwesomeIcon className="mr-2" name="save"/>
        Save
      </Button>
      <Button color="danger" size="sm" onClick={props.remove}>
        <FontAwesomeIcon className="mr-2" name="trash"/>
        Delete
      </Button>
    </li>
    <li className="breadcrumb-menu">
      <Nav className="btn-group">
        {props.isContract &&
          <React.Fragment>
            <NavLink className="btn" href="#" onClick={() => props.openAsideTab('overview')}>
              <FontAwesomeIcon className="mr-2" name="info-circle" /> Overview
            </NavLink>
            <NavLink className="btn" href="#" onClick={() => props.openAsideTab('detail')}>
              <FontAwesomeIcon className="mr-2" name="file-text-o" /> Details
            </NavLink>
            <NavLink className="btn" href="#" onClick={() => props.openAsideTab('logger')}>Logger</NavLink>
            <NavLink className="btn" href="#" onClick={() => props.openAsideTab('debugger')}>
              <FontAwesomeIcon className="mr-2" name="bug" /> Debugger
            </NavLink>
          </React.Fragment>
        }
        <NavLink className="btn" href="#" onClick={() => props.openAsideTab('browser')}>
          <FontAwesomeIcon className="mr-2" name="compass" /> Browser
        </NavLink>
      </Nav>

    </li>
  </ol>
);

TextEditorToolbar.propTypes = {
  isContract: PropTypes.bool,
  save: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func,
  currentFile: PropTypes.object
};

export default TextEditorToolbar;
