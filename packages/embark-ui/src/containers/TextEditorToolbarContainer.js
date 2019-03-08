import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditorToolbar from '../components/TextEditorToolbar';

import {
  saveFile as saveFileAction,
  removeFile as removeFileAction,
  saveFolder as saveFolderAction
} from '../actions';
import { getRootDirname, getTheme, getEditorOperationStatus } from '../reducers/selectors';

class TextEditorToolbarContainer extends Component {
  save() {
    this.props.saveFile(this.props.currentFile);
  }

  remove() {
    this.props.removeFile(this.props.currentFile);
  }

  render() {
    return <TextEditorToolbar isContract={this.props.isContract}
                              toggleShowHiddenFiles={this.props.toggleShowHiddenFiles}
                              toggleAsideTab={this.props.toggleAsideTab}
                              save={() => this.save()}
                              saveFile={this.props.saveFile}
                              theme={this.props.theme}
                              saveFolder={this.props.saveFolder}
                              rootDirname={this.props.rootDirname}
                              remove={() => this.remove()}
                              editorOperationStatus={this.props.editorOperationStatus}
                              activeTab={this.props.activeTab} />;
  }
}

TextEditorToolbarContainer.propTypes = {
  currentFile: PropTypes.object,
  editorOperationStatus: PropTypes.object,
  theme: PropTypes.string,
  isContract: PropTypes.bool,
  saveFile: PropTypes.func,
  saveFolder: PropTypes.func,
  removeFile: PropTypes.func,
  rootDirname: PropTypes.string,
  toggleShowHiddenFiles: PropTypes.func,
  toggleAsideTab: PropTypes.func,
  activeTab: PropTypes.object
};

const mapStateToProps = (state) => {
  return {
    rootDirname: getRootDirname(state),
    theme: getTheme(state),
    editorOperationStatus: getEditorOperationStatus(state)
  }
};

export default connect(
  mapStateToProps,
  {
    saveFile: saveFileAction.request,
    saveFolder: saveFolderAction.request,
    removeFile: removeFileAction.request
  },
)(TextEditorToolbarContainer);
