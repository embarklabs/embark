import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Button, Nav, NavLink} from 'reactstrap';
import classnames from 'classnames';
import FontAwesomeIcon from 'react-fontawesome';

const TextEditorToolbarTabs = {
  Overview: 'overview',
  Detail: 'detail',
  Transactions: 'transactions',
  Debugger: 'debugger',
  Browser: 'browser'
};

class TextEditorToolbar extends Component {

  isActiveTab(tab) {
    return this.props.activeTab === tab;
  }

  render() {
    return (
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item">
          <Button color="success" size="sm" className="mr-1" onClick={this.props.save}>
            <FontAwesomeIcon className="mr-2" name="save"/>
            Save
          </Button>
          <Button color="danger" size="sm" onClick={this.props.remove}>
            <FontAwesomeIcon className="mr-2" name="trash"/>
            Delete
          </Button>
        </li>
        <li className="breadcrumb-menu">
          <Nav className="btn-group">
            {this.props.isContract &&
              <React.Fragment>
                <NavLink className={classnames('btn', { active: this.isActiveTab(TextEditorToolbarTabs.Overview)})} onClick={() => this.props.openAsideTab(TextEditorToolbarTabs.Overview)}>
                  <FontAwesomeIcon className="mr-2" name="bolt" />Interact
                </NavLink>
                <NavLink className={classnames('btn', { active: this.isActiveTab(TextEditorToolbarTabs.Detail)})} href="#" onClick={() => this.props.openAsideTab(TextEditorToolbarTabs.Detail)}>
                  <FontAwesomeIcon className="mr-2" name="info-circle" />Details
                </NavLink>
                <NavLink className={classnames('btn', { active: this.isActiveTab(TextEditorToolbarTabs.Transactions)})} href="#" onClick={() => this.props.openAsideTab(TextEditorToolbarTabs.Transactions)}>
                  <FontAwesomeIcon className="mr-2" name="list-alt" />Transactions
                </NavLink>
                <NavLink className={classnames('btn', { active: this.isActiveTab(TextEditorToolbarTabs.Debugger)})} href="#" onClick={() => this.props.openAsideTab(TextEditorToolbarTabs.Debugger)}>
                  <FontAwesomeIcon className="mr-2" name="bug" />Debugger
                </NavLink>
              </React.Fragment>
            }
            <NavLink className={classnames('btn', { active: this.isActiveTab(TextEditorToolbarTabs.Browser)})} href="#" onClick={() => this.props.openAsideTab(TextEditorToolbarTabs.Browser)}>
              <FontAwesomeIcon className="mr-2" name="eye" /> Preview
            </NavLink>
          </Nav>

        </li>
      </ol>
    );
  }
}

TextEditorToolbar.propTypes = {
  isContract: PropTypes.bool,
  save: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func,
  activeTab: PropTypes.string
};

export default TextEditorToolbar;
