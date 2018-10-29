import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditorToolbar from '../components/TextEditorToolbar';

import {
  saveFile as saveFileAction,
  removeFile as removeFileAction
} from '../actions';

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
                              openAsideTab={this.props.openAsideTab}
                              save={() => this.save()}
                              remove={() => this.remove()}
                              activeTab={this.props.activeTab} />;
  }
}

TextEditorToolbarContainer.propTypes = {
  currentFile: PropTypes.object,
  isContract: PropTypes.bool,
  saveFile: PropTypes.func,
  removeFile: PropTypes.func,
  toggleShowHiddenFiles: PropTypes.func,
  openAsideTab: PropTypes.func,
  activeTab: PropTypes.object
};

export default connect(
  null,
  {
    saveFile: saveFileAction.request,
    removeFile: removeFileAction.request
  },
)(TextEditorToolbarContainer);
