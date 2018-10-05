import React from 'react';
import * as monaco from 'monaco-editor';
import PropTypes from 'prop-types';

const SUPPORTED_LANGUAGES = ['css', 'sol', 'html', 'json'];
const DEFAULT_LANGUAGE = 'javascript';
const EDITOR_ID = 'react-monaco-editor-container';

let editor;

const initMonaco = (value) => {
  let model;
  if (editor) {
    model = editor.getModel()
  }
  editor = monaco.editor.create(document.getElementById(EDITOR_ID), {
    value,
    model
  });
  monaco.editor.setTheme("vs-dark");
};

class TextEditor extends React.Component {
  componentDidMount() {
    initMonaco();
    editor.onDidChangeModelContent((event) => {
      const value = editor.getValue();
      this.props.onFileContentChange(value);
    });
  }

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

  updateMarkers() {
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
    monaco.editor.setModelMarkers(editor.getModel(), 'test', markers);
  }

  updateLanguage() {
    const newLanguage = this.getLanguage();
    const currentLanguage = editor.getModel().getModeId();
    if (newLanguage !== currentLanguage) {
      monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.file.content !== prevProps.file.content) {
      editor.setValue(this.props.file.content);
    }

    this.updateMarkers();
    this.updateLanguage();
  }

  render() {
    const style = {
      width: "800px",
      height: "600px"
    };

    return <div ref={this.assignRef} style={style} id={EDITOR_ID} />;
  }
}

TextEditor.propTypes = {
  onFileContentChange: PropTypes.func,
  file: PropTypes.object,
  contractCompile: PropTypes.object
};

export default TextEditor;