import React from 'react';
import * as monaco from 'monaco-editor';
import PropTypes from 'prop-types';
import FontAwesomeIcon from 'react-fontawesome';
import classNames from 'classnames';

import {DARK_THEME, LIGHT_THEME} from '../constants';

const SUPPORTED_LANGUAGES = ['css', 'sol', 'html', 'json'];
const DEFAULT_LANGUAGE = 'javascript';
const EDITOR_ID = 'react-monaco-editor-container';
const GUTTER_GLYPH_MARGIN = 2;

let editor;

const initMonaco = (value, theme) => {
  let model;
  if (editor) {
    model = editor.getModel();
  }
  editor = monaco.editor.create(document.getElementById(EDITOR_ID), {
    glyphMargin: true,
    value,
    model
  });
};

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {decorations: []};
  }
  componentDidMount() {
    initMonaco();
    editor.onDidChangeModelContent((_event) => {
      const value = editor.getValue();
      this.props.onFileContentChange(value);
    });
    editor.layout();
    window.addEventListener('resize', this.handleResize);

    editor.onMouseDown((e) => {
      if (e.target.type === GUTTER_GLYPH_MARGIN){
        this.props.toggleBreakpoint(this.props.currentFile.name, e.target.position.lineNumber);
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => editor.layout();


  getLanguage() {
    if (!this.props.currentFile.name) {
      return DEFAULT_LANGUAGE;
    }
    const extension = this.props.currentFile.name.split('.').pop();
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

    let debuggerLine = this.props.debuggerLine;
    newDecorations.push({
      range: new monaco.Range(debuggerLine,1,debuggerLine,1),
        options: {
          isWholeLine: true,
          className: 'text-editor__debuggerLine'
        }
    });
    const decorations = editor.deltaDecorations(this.state.decorations, newDecorations);
    this.setState({decorations: decorations});
  }

  setTheme() {
    const vsTheme = this.props.theme === DARK_THEME ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(vsTheme);
  }

  componentDidUpdate(prevProps) {
    const isNewContent = this.props.currentFile.content !== prevProps.currentFile.content;
    if (isNewContent) {
      editor.setValue(this.props.currentFile.content || '');
    }

    this.updateMarkers();
    const expectedDecorationsLength = this.props.debuggerLine ? this.props.breakpoints.length + 1 : this.props.breakpoints.length;
    if (expectedDecorationsLength !== this.state.decorations.length || this.props.debuggerLine !== prevProps.debuggerLine || isNewContent) {
      this.updateDecorations();
    }

    this.setTheme();
    this.updateLanguage();
    this.handleResize();
  }

  addEditorTabs(e, file) {
    e.preventDefault(); this.props.addEditorTabs(file);
  }

  renderTabs() {
    return (
      <ul className="list-inline m-0 p-0">
        {this.props.editorTabs.map(file => (
          <li key={file.name} className={classNames("p-2", "list-inline-item", "mr-0", "border-right", {
            'bg-white': file.active && LIGHT_THEME === this.props.theme,
            'bg-black': file.active && DARK_THEME === this.props.theme
          })}>
            <a
              href="#switch-tab"
              onClick={(e) => this.addEditorTabs(e, file)}
              className="p-2 text-muted"
            >
              {file.name}
            </a>
            <FontAwesomeIcon style={{cursor: 'pointer'}} onClick={() => this.props.removeEditorTabs(file)} className="px-1" name="close"/>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    return (
      <div className="h-100 d-flex flex-column">
        {this.renderTabs()}
        <div style={{height: '100%'}} id={EDITOR_ID}/>
      </div>
    );
  }
}

TextEditor.propTypes = {
  onFileContentChange: PropTypes.func,
  currentFile: PropTypes.object,
  toggleBreakpoint: PropTypes.func,
  breakpoints: PropTypes.array,
  debuggerLine: PropTypes.number,
  editorTabs: PropTypes.array,
  removeEditorTabs: PropTypes.func,
  addEditorTabs: PropTypes.func,
  theme: PropTypes.string
};

export default TextEditor;
