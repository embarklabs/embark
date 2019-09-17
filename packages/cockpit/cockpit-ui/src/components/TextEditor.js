import React from 'react';
import PropTypes from 'prop-types';
import FontAwesomeIcon from 'react-fontawesome';
import classNames from 'classnames';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import arrayMove from 'array-move';

import {DARK_THEME, LIGHT_THEME} from '../constants';

import {monaco as monacoReact} from '@monaco-editor/react';
monacoReact
  .config({
    urls: {
      monacoLoader: '/vsdir/vsdir/vs/loader.js',
      monacoBase: '/vsdir/vsdir/vs'
    },
  });

const SUPPORTED_LANGUAGES = ['css', 'sol', 'html', 'json'];
const DEFAULT_LANGUAGE = 'javascript';
const EDITOR_ID = 'react-monaco-editor-container';
const GUTTER_GLYPH_MARGIN = 2;

let monacoResolved;
let rejectMonaco;
let resolveMonaco;
let monaco;
function freshMonacoPromise() {
  monacoResolved = false;
  monaco = new Promise((res, rej) => {
    resolveMonaco = v => { monacoResolved = true ; res(v); };
    rejectMonaco = rej;
  });
  monaco.catch(console.error);
}
freshMonacoPromise();

let editorResolved;
let rejectEditor;
let resolveEditor;
let editor;
function freshEditorPromise() {
  editorResolved = false;
  editor = new Promise((res, rej) => {
    resolveEditor = v => { editorResolved = true ; res(v); };
    rejectEditor = rej;
  });
  editor.catch(console.error);
}
freshEditorPromise();

const initMonaco = async (value, theme) => {
  let model;
  if (editorResolved) {
    model = (await editor).getModel();
  }
  freshEditorPromise();

  let _monaco;
  if (monacoResolved) {
    _monaco = await monaco;
  } else {
    freshMonacoPromise();
    try {
      _monaco = await monacoReact.init();
      resolveMonaco(_monaco);
    } catch (err) {
      rejectMonaco(err);
      rejectEditor(new Error('could not initialize monaco-editor'));
      return;
    }
  }
  try {
    resolveEditor(_monaco.editor.create(document.getElementById(EDITOR_ID), {
      glyphMargin: true,
      value,
      model
    }));
  } catch (err) {
    rejectEditor(err);
  }
};

const Tab = SortableElement(({file, onTabClick, onTabClose, theme}) => {
  return (
    <li key={file.name} className={classNames("tab", "p-2", "pl-3", "pr-3", "list-inline-item", "mr-0", "border-right", "border-bottom",
    {
      'border-light': LIGHT_THEME === theme,
      'border-dark': DARK_THEME === theme
    },
    {
      'active': file.active
    })}>
      <a
        href="#switch-file"
        onClick={(e) => onTabClick(e, file)}
        className="mr-3 text-muted d-inline-block align-middle"
      >
        {file.name}
      </a>
      <FontAwesomeIcon style={{cursor: 'pointer'}} onClick={() => onTabClose(file)} className="px-0 align-middle" name="close"/>
    </li>
  );
});

const Tabs = SortableContainer(({files, onTabClick, onTabClose, theme}) => {
  return (
    <ul className="list-inline m-0 p-0">
      {files && files.map((file, index) => (
        <Tab key={file.name} index={index} file={file} onTabClick={onTabClick} onTabClose={onTabClose} theme={theme} />
      ))}
    </ul>
  );
});

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {decorations: []};
    this.tabsContainerRef = React.createRef();
  }

  async componentDidMount() {
    await initMonaco();
    const _editor = await editor;
    _editor.onDidChangeModelContent((_event) => {
      const value = _editor.getValue();
      this.props.onFileContentChange(value);
    });
    _editor.layout();
    window.addEventListener('resize', this.handleResize);

    _editor.onMouseDown((e) => {
      if (e.target.type === GUTTER_GLYPH_MARGIN){
        this.props.toggleBreakpoint(this.props.currentFile.name, e.target.position.lineNumber);
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = async () => (await editor).layout();

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

  async updateLanguage() {
    const _editor = await editor;
    const newLanguage = this.getLanguage();
    const currentLanguage = _editor.getModel().getModeId();
    if (newLanguage !== currentLanguage) {
      (await monaco).editor.setModelLanguage(_editor.getModel(), newLanguage);
    }
  }

  async updateDecorations() {
    const _monaco = await monaco;
    const newDecorations = await Promise.all(this.props.breakpoints.map(async breakpoint => (
      {
        range: new (_monaco.Range)(breakpoint,1,breakpoint,1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'bg-primary rounded-circle'
        }
      }
    )));

    let debuggerLine = this.props.debuggerLine;
    if (debuggerLine) {
      newDecorations.push({
        range: new (_monaco.Range)(debuggerLine, 1, debuggerLine, 1),
        options: {
          isWholeLine: true,
          className: 'text-editor__debuggerLine'
        }
      });
    }

    const decorations = (await editor).deltaDecorations(this.state.decorations, newDecorations);
    this.setState({decorations: decorations});
  }

  async setTheme() {
    const vsTheme = this.props.theme === DARK_THEME ? 'vs-dark' : 'vs';
    (await monaco).editor.setTheme(vsTheme);
  }

  async componentDidUpdate(prevProps) {
    const isNewContent = this.props.currentFile.content !== prevProps.currentFile.content;
    if (isNewContent) {
      (await editor).setValue(this.props.currentFile.content || '');
    }

    this.updateMarkers();
    const expectedDecorationsLength = this.props.debuggerLine ? this.props.breakpoints.length + 1 : this.props.breakpoints.length;
    if (expectedDecorationsLength !== this.state.decorations.length || this.props.debuggerLine !== prevProps.debuggerLine || isNewContent) {
      await this.updateDecorations();
    }

    await this.setTheme();
    await this.updateLanguage();
    await this.handleResize();
  }

  addEditorTabs = (e, file) => {
    e.preventDefault();
    this.props.addEditorTabs(file);
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    const editorTabs = arrayMove(this.props.editorTabs, oldIndex, newIndex);
    this.props.updateEditorTabs(editorTabs);
  }

  render() {
    return (
      <div className="h-100 d-flex flex-column tabs-container" ref={this.tabsContainerRef}>
        <Tabs
          axis="xy"
          lockToContainerEdges={true}
          lockOffset={0}
          disableAutoScroll={true}
          helperClass={"dragging"}
          helperContainer={this.tabsContainerRef.current}
          files={this.props.editorTabs}
          theme={this.props.theme}
          onTabClick={this.addEditorTabs}
          onTabClose={this.props.removeEditorTabs}
          onSortEnd={this.onSortEnd}
          distance={3}
        />
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
  theme: PropTypes.string,
  updateEditorTabs: PropTypes.func
};

export default TextEditor;
