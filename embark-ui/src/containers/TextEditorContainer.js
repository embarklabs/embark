import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditor from '../components/TextEditor';
import {
  addEditorTabs as addEditorTabsAction,
  fetchEditorTabs as fetchEditorTabsAction,
  removeEditorTabs as removeEditorTabsAction,
  toggleBreakpoint,
} from '../actions';

import {getCurrentFile, getContractCompile, getContractDeploys, getBreakpointsByFilename, getDebuggerLine, getEditorTabs} from '../reducers/selectors';

class TextEditorContainer extends React.Component {
  componentDidMount() {
    this.props.fetchEditorTabs();
  }

  render() {
    return (
      <TextEditor file={this.props.currentFile}
                  currentFile={this.props.currentFile}
                  breakpoints={this.props.breakpoints}
                  toggleBreakpoint={this.props.toggleBreakpoint}
                  editorTabs={this.props.editorTabs}
                  removeEditorTabs={this.props.removeEditorTabs}
                  addEditorTabs={this.props.addEditorTabs}
                  debuggerLine={this.props.debuggerLine}
                  onFileContentChange={this.props.onFileContentChange} />
    )
  }
}

function mapStateToProps(state, props) {
  const breakpoints = getBreakpointsByFilename(state, props.currentFile.name);
  const editorTabs = getEditorTabs(state);
  const debuggerLine = getDebuggerLine(state);
  return {breakpoints, editorTabs, debuggerLine};
}

TextEditorContainer.propTypes = {
  currentFile: PropTypes.object,
  onFileContentChange: PropTypes.func,
  toggleBreakpoints: PropTypes.func,
  breakpoints: PropTypes.array,
  toggleBreakpoint: PropTypes.object,
  fetchEditorTabs: PropTypes.func,
  removeEditorTabs: PropTypes.func,
  addEditorTabs: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    toggleBreakpoint,
    fetchEditorTabs: fetchEditorTabsAction.request,
    removeEditorTabs: removeEditorTabsAction.request,
    addEditorTabs: addEditorTabsAction.request
  },
)(TextEditorContainer);
