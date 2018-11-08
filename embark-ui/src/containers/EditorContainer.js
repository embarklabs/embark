import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Row, Col} from 'reactstrap';
import TextEditorAsideContainer from './TextEditorAsideContainer';
import TextEditorContainer from './TextEditorContainer';
import FileExplorerContainer from './FileExplorerContainer';
import TextEditorToolbarContainer from './TextEditorToolbarContainer';
import {fetchEditorTabs as fetchEditorTabsAction} from '../actions';
import {getCurrentFile} from '../reducers/selectors';
import classnames from 'classnames';
import Resizable from 're-resizable';
import {OPERATIONS} from '../constants';

import './EditorContainer.css';

class EditorContainer extends React.Component {
  constructor(props) {
    super(props);
    this.DEFAULT_EDITOR_WIDTH = 85;
    this.DEFAULT_EDITOR_WIDTH_SMALL = 75;
    this.DEFAULT_HEIGHT = 500;
    this.SMALL_SIZE = 768;
    this.windowWidth = window.innerWidth;

    this.state = {
      currentAsideTab: {}, showHiddenFiles: false, currentFile: this.props.currentFile,
      editorHeight: this.DEFAULT_HEIGHT,
      editorWidth: ((this.windowWidth < this.SMALL_SIZE) ? this.DEFAULT_EDITOR_WIDTH_SMALL : this.DEFAULT_EDITOR_WIDTH) + '%',
      asideHeight: '100%', asideWidth: '25%',
      isSmallSize: (this.windowWidth < this.SMALL_SIZE)
    };
  }

  componentDidMount() {
    this.props.fetchEditorTabs();
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  updateDimensions() {
    this.windowWidth = window.innerWidth;

    const isSmallSize = (this.windowWidth < this.SMALL_SIZE);
    if (this.state.isSmallSize !== isSmallSize) {
      this.setState({isSmallSize});
      this.changeEditorWidth(isSmallSize ? OPERATIONS.MORE : OPERATIONS.LESS);
      this.editor.handleResize();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }
  }

  isContract() {
    return this.state.currentFile.name && this.state.currentFile.name.endsWith('.sol');
  }

  onFileContentChange(newContent) {
    const newCurrentFile = this.state.currentFile;
    newCurrentFile.content = newContent;
    this.setState({currentFile: newCurrentFile});
  }

  toggleShowHiddenFiles() {
    this.setState({showHiddenFiles: !this.state.showHiddenFiles});
  }

  openAsideTab(newTab) {
    if (!this.state.isSmallSize) {
      this.changeEditorWidth((!this.state.currentAsideTab.label) ? OPERATIONS.LESS : OPERATIONS.MORE);
    }
    if (newTab.label === this.state.currentAsideTab.label) {
      this.editor.handleResize();
      return this.setState({currentAsideTab: {}});
    }

    this.setState({currentAsideTab: newTab});
  }

  changeEditorWidth(operation) {
    this.setState({
      editorWidth: (parseFloat(this.state.editorWidth) + (operation * parseFloat(this.state.asideWidth))) + '%'
    });
  }

  renderTextEditor() {
    const height = !!(this.state.isSmallSize && this.state.currentAsideTab.label) ? this.state.editorHeight : 'auto';
    return (
      <Resizable
        size={{width: this.state.editorWidth, height: height}}
        minWidth="20%" maxWidth="90%"
        handleClasses={{left: 'resizer-handle', right: 'resizer-handle', bottom: 'resize-handle-horizontal'}}
        onResizeStop={(e, direction, ref, d) => {
          this.setState({
            editorWidth: ref.style.width,
            editorHeight: this.state.editorHeight + d.height
          });
          this.editor.handleResize();
        }}
        className="text-editor-container border-left"
        enable={{
          top: false,
          right: false,
          bottom: !!(this.state.isSmallSize && this.state.currentAsideTab.label),
          left: true,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false
        }}>
        <TextEditorContainer
          ref={instance => {
            this.editor = instance ? instance.getWrappedInstance().editor : null;
          }}
          currentFile={this.props.currentFile}
          onFileContentChange={(newContent) => this.onFileContentChange(newContent)}/>
      </Resizable>
    );
  }

  renderAside() {
    const aside = (
      <div className="editor-aside">
        <TextEditorAsideContainer currentAsideTab={this.state.currentAsideTab}
                                  currentFile={this.props.currentFile}/>
      </div>
    );

    if (this.windowWidth < this.SMALL_SIZE) {
      return (<Col sm={12} className="border-left-0 relative">
        {aside}
      </Col>);
    }

    return (
      <Resizable defaultSize={{width: this.state.asideWidth, height: 'auto'}}
                 maxWidth='60%' minWidth='17%'
                 handleClasses={{left: 'resizer-handle', right: 'resizer-handle'}}
                 className="border-left-0 relative"
                 enable={{
                   top: false,
                   right: false,
                   bottom: false,
                   left: true,
                   topRight: false,
                   bottomRight: false,
                   bottomLeft: false,
                   topLeft: false
                 }}
                 onResize={(e, direction, ref, _d) => {
                   this.setState({
                     editorWidth: this.DEFAULT_EDITOR_WIDTH - parseFloat(ref.style.width) + '%'
                   });
                 }}>
        {aside}
      </Resizable>
    );
  }

  render() {
    return (
      <Row noGutters
           className={classnames('h-100', 'editor--grid', {'aside-opened': this.state.currentAsideTab.label})}>
        <Col xs={12}>
          <TextEditorToolbarContainer openAsideTab={(newTab) => this.openAsideTab(newTab)}
                                      isContract={this.isContract()}
                                      currentFile={this.props.currentFile}
                                      activeTab={this.state.currentAsideTab}/>
        </Col>

        <Col className="border-right">
          <FileExplorerContainer showHiddenFiles={this.state.showHiddenFiles}
                                 toggleShowHiddenFiles={() => this.toggleShowHiddenFiles()}/>
        </Col>

        {this.renderTextEditor()}

        {this.state.currentAsideTab.label && this.renderAside()}
      </Row>
    );
  }
}

function mapStateToProps(state, _props) {
  const currentFile = getCurrentFile(state);

  return {
    currentFile
  };
}

EditorContainer.propTypes = {
  currentFile: PropTypes.object,
  fetchEditorTabs: PropTypes.func
};

export default connect(
  mapStateToProps,
  {fetchEditorTabs: fetchEditorTabsAction.request}
)(EditorContainer);

