import React from 'react';
import * as monaco from 'monaco-editor';
import PropTypes from 'prop-types';

import './TextEditor.css';

const SUPPORTED_LANGUAGES = ['css', 'sol', 'html', 'json'];
const DEFAULT_LANGUAGE = 'javascript';
const EDITOR_ID = 'react-monaco-editor-container';
const GUTTER_GLYPH_MARGIN = 2;

let editor;

const initMonaco = (value) => {
  let model;
  if (editor) {
    model = editor.getModel()
  }
  editor = monaco.editor.create(document.getElementById(EDITOR_ID), {
    glyphMargin: true,
    value,
    model
  });
  monaco.editor.setTheme("vs-dark");
};

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {decorations: []};
  }
  componentDidMount() {
    initMonaco();
    editor.onDidChangeModelContent((event) => {
      const value = editor.getValue();
      this.props.onFileContentChange(value);
    });
    editor.layout();
    window.addEventListener('resize', this.handleResize);

    editor.onMouseDown((e) => {
      if (e.target.type === GUTTER_GLYPH_MARGIN){
        this.props.toggleBreakpoint(this.props.file.name, e.target.position.lineNumber);
      }
    });
  }

  handleResize = () => editor.layout();


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
    // TODO: Fetch Result of compilation in embark, via ws
    // const {errors, warnings} = this.props.contractCompile;
    // const markers = [].concat(errors).concat(warnings).filter((e) => e).map((e) => {
    //   const {row, col} = this.extractRowCol(e.formattedMessage);
    //   return {
    //     startLineNumber: row,
    //     startColumn: col,
    //     endLineNumber: row,
    //     endColumn: col + 1,
    //     message: e.formattedMessage,
    //     severity: e.severity
    //   };
    // });
    // monaco.editor.setModelMarkers(editor.getModel(), 'test', markers);
  }

  updateLanguage() {
    const newLanguage = this.getLanguage();
    const currentLanguage = editor.getModel().getModeId();
    if (newLanguage !== currentLanguage) {
      monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
    }
  }

  updateDecorations() {
    const newDecorations = this.props.breakpoints.map(breakpoint => (
      {
        range: new monaco.Range(breakpoint,1,breakpoint,1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'bg-primary rounded-circle'
        }
      }
    ));

    //TODO remove me when debuggerLine comes from the debugger API
    let debuggerLine = this.props.debuggerLine || 11;
    newDecorations.push({
      range: new monaco.Range(debuggerLine,1,debuggerLine,1),
        options: {
          isWholeLine: true,
          className: 'text-editor__debuggerLine'
        }
    })
    const decorations = editor.deltaDecorations(this.state.decorations, newDecorations);
    this.setState({decorations: decorations});
  }

  componentDidUpdate(prevProps) {
    if (this.props.file.content !== prevProps.file.content) {
      editor.setValue(this.props.file.content);
    }

    this.updateMarkers();
    // TODO replace with const expectedDecorationsLength = this.props.debuggerLine ? this.props.breakpoints.length + 1 : this.props.breakpoints.length
    const expectedDecorationsLength = this.props.breakpoints.length + 1;
    if (expectedDecorationsLength !== this.state.decorations.length) {
      this.updateDecorations();
    }
    this.updateLanguage();
    this.handleResize();
  }

  render() {
    return (
      <div className="h-100 d-flex flex-column">
        <div style={{height: '100%'}} id={EDITOR_ID} />
      </div>
    )
  }
}

TextEditor.propTypes = {
  onFileContentChange: PropTypes.func,
  file: PropTypes.object,
  toggleBreakpoint: PropTypes.func,
  breakpoints: PropTypes.array,
  debuggerLine: PropTypes.number
};

export default TextEditor;