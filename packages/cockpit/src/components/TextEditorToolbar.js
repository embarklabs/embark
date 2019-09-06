import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Button, Nav, NavLink} from 'reactstrap';
import classnames from 'classnames';
import FontAwesomeIcon from 'react-fontawesome';

import AddFileModal from '../components/AddFileModal';
import AddFolderModal from '../components/AddFolderModal';

const StatusText = ({message, icon, spin = false}) => (
  <span className="ml-2"><FontAwesomeIcon className="mr-1" name={icon} spin={spin}/>{message}</span>
);

StatusText.propTypes = {
  message: PropTypes.string,
  icon: PropTypes.string,
  spin: PropTypes.bool
};

export const TextEditorToolbarTabs = {
  Interact: { label: 'Interact', icon: 'bolt' },
  Details: { label: 'Details', icon: 'info-circle' },
  Debugger: { label: 'Debugger', icon: 'bug' },
  Log: { label: 'Log', icon: 'list-alt' },
  Browser: { label: 'Browser', icon: 'eye' }
};

class TextEditorToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      successMessage: ''
    };
    this.addFileModal = React.createRef();
    this.addFolderModal = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.editorOperationStatus.success !== prevProps.editorOperationStatus.success) {
      this.setState({successMessage: this.props.editorOperationStatus.success});
      setTimeout(() => {
        this.setState({successMessage: ''});
      }, 3000);
    }
  }

  isActiveTab(tab) {
    return this.props.activeTab === tab;
  }

  isBrowserTab(tab) {
    return tab === TextEditorToolbarTabs.Browser;
  }

  isDebuggerTab(tab) {
    return tab === TextEditorToolbarTabs.Debugger;
  }

  renderTab(tab) {
    return (
      <NavLink key={tab.label} className={classnames('btn', { active: this.isActiveTab(tab)})} onClick={() => this.props.toggleAsideTab(tab)}>
        <FontAwesomeIcon className="mr-2" name={tab.icon} /> {tab.label}
      </NavLink>
    );
  }

  render() {
    return (
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item">
          <Button color="success" size="sm" className="mr-1" onClick={() => this.addFileModal.current.toggle()}>
            <FontAwesomeIcon className="mr-2" name="plus"/>
            Add File
          </Button>
          <AddFileModal theme={this.props.theme} node={{path: this.props.rootDirname}} saveFile={this.props.saveFile} ref={this.addFileModal} />
          <Button color="success" size="sm" className="mr-1" onClick={() => this.addFolderModal.current.toggle()}>
            <FontAwesomeIcon className="mr-2" name="folder-open"/>
            Add Folder
          </Button>
          <AddFolderModal theme={this.props.theme} node={{path: this.props.rootDirname}} saveFolder={this.props.saveFolder} ref={this.addFolderModal} />
          <Button color="success" size="sm" className="mr-1" onClick={this.props.save}>
            <FontAwesomeIcon className="mr-2" name="save"/>
            Save
          </Button>
          <Button color="danger" size="sm" onClick={this.props.remove}>
            <FontAwesomeIcon className="mr-2" name="trash"/>
            Delete
          </Button>
          {this.state.successMessage && <StatusText message={this.state.successMessage} icon="check"/>}
          {this.props.editorOperationStatus.loading && <StatusText message="Processing..." icon="spinner" spin={true}/>}
          {this.props.editorOperationStatus.error && <StatusText message={this.props.editorOperationStatus.error} icon="exclamation-triangle"/>}
        </li>
        <li className="breadcrumb-menu">
          <Nav className="btn-group">
            {this.props.isContract && Object.values(TextEditorToolbarTabs).map(tab => !this.isBrowserTab(tab) && !this.isDebuggerTab(tab) && this.renderTab(tab))}
            {this.renderTab(TextEditorToolbarTabs.Debugger)}
            {this.renderTab(TextEditorToolbarTabs.Browser)}
          </Nav>
        </li>
      </ol>
    );
  }
}

TextEditorToolbar.propTypes = {
  isContract: PropTypes.bool,
  theme: PropTypes.string,
  save: PropTypes.func,
  saveFile: PropTypes.func,
  rootDirname: PropTypes.string,
  saveFolder: PropTypes.func,
  remove: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  toggleAsideTab: PropTypes.func,
  activeTab: PropTypes.object,
  editorOperationStatus: PropTypes.object
};

export default TextEditorToolbar;
