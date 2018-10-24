import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TextEditor from '../components/TextEditor';
import {
  toggleBreakpoint,
} from '../actions';

import {getCurrentFile, getContractCompile, getContractDeploys, getBreakpointsByFilename, getDebuggerLine} from '../reducers/selectors';

const TextEditorContainer = (props) => (
  <TextEditor file={props.currentFile}
              breakpoints={props.breakpoints}
              toggleBreakpoint={props.toggleBreakpoint}
              debuggerLine={props.debuggerLine}
              onFileContentChange={props.onFileContentChange} />
)

function mapStateToProps(state, props) {
  const breakpoints = getBreakpointsByFilename(state, props.currentFile.name);
  const debuggerLine = getDebuggerLine(state);
  return {breakpoints, debuggerLine};
}

TextEditorContainer.propTypes = {
  currentFile: PropTypes.object,
  onFileContentChange: PropTypes.func,
  toggleBreakpoints: PropTypes.func,
  breakpoints: PropTypes.array,
  toggleBreakpoint: PropTypes.object
};

export default connect(
  mapStateToProps,
  {toggleBreakpoint},
)(TextEditorContainer);
