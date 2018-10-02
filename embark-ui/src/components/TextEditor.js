import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import PropTypes from 'prop-types';

const SUPPORTED_LANGUAGES = ['css', 'sol', 'html'];
const DEFAULT_LANGUAGE = 'javascript';

class TextEditor extends React.Component {
  getLanguage() {
    const extension = this.props.file.name.split('.').pop();
    return SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.indexOf(extension)] || DEFAULT_LANGUAGE;
  }

  extractRowCol(errorMessage) {
    const errorSplit = errorMessage.split(':');
    if (errorSplit.length >= 3) {
      return {row: parseInt(errorSplit[1], 10), col: parseInt(errorSplit[2], 10)};
    }
    return {row: 0, col: 0};
  }

  componentDidUpdate() {
    const {errors, warnings} = this.props.contractCompile;
    const markers = [].concat(errors).concat(warnings).filter((e) => e).map((e) => {
      const {row, col} = this.extractRowCol(e.formattedMessage);
      return {
        startLineNumber: row,
        startColumn: col,
        endLineNumber: row,
        endColumn: col + 1,
        message: e.formattedMessage,
        severity: e.severity
      };
    });
    this.state.monaco.editor.setModelMarkers(this.state.editor.getModel(), 'test', markers);

    const newLanguage = this.getLanguage();
    const currentLanguage = this.state.editor.getModel().getModeId();

    if (newLanguage !== currentLanguage) {
      this.state.monaco.editor.setModelLanguage(this.state.editor.getModel(), newLanguage);
    }
  }

  editorDidMount(editor, monaco) {
    this.setState({editor, monaco});
  }

  render() {
    return (
      <MonacoEditor
        width="800"
        height="600"
        theme="vs-dark"
        value={this.props.file.content}
        onChange={this.props.onFileContentChange}
        editorDidMount={(editor, monaco) => this.editorDidMount(editor, monaco)}
      />
    );
  }
}

TextEditor.propTypes = {
  onFileContentChange: PropTypes.func,
  file: PropTypes.object,
  contractCompile: PropTypes.object
};

export default TextEditor;
