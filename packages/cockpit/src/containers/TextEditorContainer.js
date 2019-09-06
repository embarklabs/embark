import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditor from '../components/TextEditor';
import {
  addEditorTabs as addEditorTabsAction,
  fetchEditorTabs as fetchEditorTabsAction,
  removeEditorTabs as removeEditorTabsAction,
  toggleBreakpoint,
  updateEditorTabs as updateEditorTabsAction
} from '../actions';

import {getBreakpointsByFilename, getDebuggerLine, getEditorTabs, getTheme} from '../reducers/selectors';

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
                  updateEditorTabs={this.props.updateEditorTabs}
                  debuggerLine={this.props.debuggerLine}
                  onFileContentChange={this.props.onFileContentChange}
                  theme={this.props.theme}
                  ref={instance => {
                    if (instance) this.editor = instance;
                  }}/>
    );
  }
}

function mapStateToProps(state, props) {
  const breakpoints = getBreakpointsByFilename(state, props.currentFile.name);
  const editorTabs = getEditorTabs(state);
  const debuggerLine = getDebuggerLine(state);
  const theme = getTheme(state);
  return {breakpoints, editorTabs, debuggerLine, theme};
}

TextEditorContainer.propTypes = {
  currentFile: PropTypes.object,
  onFileContentChange: PropTypes.func,
  toggleBreakpoints: PropTypes.func,
  breakpoints: PropTypes.array,
  toggleBreakpoint: PropTypes.func,
  fetchEditorTabs: PropTypes.func,
  removeEditorTabs: PropTypes.func,
  addEditorTabs: PropTypes.func,
  updateEditorTabs: PropTypes.func,
  debuggerLine: PropTypes.number,
  editorTabs: PropTypes.array,
  theme: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    toggleBreakpoint: toggleBreakpoint.request,
    fetchEditorTabs: fetchEditorTabsAction.request,
    removeEditorTabs: removeEditorTabsAction.request,
    addEditorTabs: addEditorTabsAction.request,
    updateEditorTabs: updateEditorTabsAction.request
  },
  null,
  { withRef: true }
)(TextEditorContainer);
