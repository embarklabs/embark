import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";
import {Row, Col} from 'reactstrap';
import classnames from 'classnames';
import {Resizable} from 're-resizable';

import TextEditorAsideContainer from './TextEditorAsideContainer';
import TextEditorContainer from './TextEditorContainer';
import FileExplorerContainer from './FileExplorerContainer';
import TextEditorToolbarContainer from './TextEditorToolbarContainer';
import {
  fetchEditorTabs as fetchEditorTabsAction,
  contracts as contractsAction,
  file as fileAction,
  transaction as transactionAction
} from '../actions';
import {getCurrentFile, getContracts, getTransaction} from '../reducers/selectors';
import {getDebuggerTransactionHash} from '../utils/utils';
import {OPERATIONS} from '../constants';
import { TextEditorToolbarTabs } from '../components/TextEditorToolbar';
import PageHead from '../components/PageHead';

import './EditorContainer.scss';

class EditorContainer extends React.Component {
  constructor(props) {
    super(props);
    this.DEFAULT_EDITOR_WIDTH = 85;
    this.DEFAULT_EDITOR_WIDTH_SMALL = 75;
    this.DEFAULT_HEIGHT = 500;
    this.SMALL_SIZE = 768;
    this.windowWidth = window.innerWidth;

    this.state = {
      currentAsideTab: {},
      debuggingContract: null,
      showHiddenFiles: false,
      currentFile: this.props.currentFile,
      editorHeight: this.DEFAULT_HEIGHT,
      editorWidth: ((this.windowWidth < this.SMALL_SIZE) ? this.DEFAULT_EDITOR_WIDTH_SMALL : this.DEFAULT_EDITOR_WIDTH) + '%',
      asideHeight: '100%',
      asideWidth: '25%',
      isSmallSize: (this.windowWidth < this.SMALL_SIZE)
    };
  }

  componentDidMount() {
    this.props.fetchEditorTabs();
    this.props.fetchContracts();
    this.initializeDebugger(this.props.debuggerTransactionHash);
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  initializeDebugger(debuggerTransactionHash) {
    if (debuggerTransactionHash) {
      this.props.fetchTransaction(debuggerTransactionHash);
    }
  }

  updateDimensions() {
    this.windowWidth = window.innerWidth;

    const isSmallSize = (this.windowWidth < this.SMALL_SIZE);
    if (this.state.isSmallSize !== isSmallSize) {
      const editorWidth = this.getNewEditorWidth(isSmallSize ? OPERATIONS.MORE : OPERATIONS.LESS);
      this.setState({isSmallSize, editorWidth});
      this.editor.handleResize();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }

    if (this.props.contracts.length && this.props.transaction) {
      const debuggingContract = this.props.contracts.find(contract => contract.deployedAddress === this.props.transaction.to)
      if (debuggingContract && this.state.debuggingContract !== debuggingContract) {
        const editorWidth = this.getNewEditorWidth(OPERATIONS.LESS)
        this.setState({currentAsideTab: TextEditorToolbarTabs.Debugger, editorWidth, debuggingContract})
        this.props.fetchFile({path: debuggingContract.path});
      }
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

  toggleAsideTab(newTab) {
    const opening = !this.state.currentAsideTab.label;
    const closing = newTab.label === this.state.currentAsideTab.label;
    const newState = {currentAsideTab: newTab};

    if (!this.state.isSmallSize) {
      if (closing) {
        newState.editorWidth = this.getNewEditorWidth(OPERATIONS.MORE);
      } else if (opening) {
        newState.editorWidth = this.getNewEditorWidth(OPERATIONS.LESS);
      }
    }
    if (closing) {
      newState.currentAsideTab = {};
    }

    this.editor.handleResize();
    this.setState(newState);
  }

  getNewEditorWidth(operation) {
    return (parseFloat(this.state.editorWidth) + (operation * parseFloat(this.state.asideWidth))) + '%'
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
                                  debuggerTransactionHash={this.props.debuggerTransactionHash}
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
      <React.Fragment>
        <PageHead title="Editor" description="Create, read, edit, and delete your dApp's files. Interact and debug your dApp's contracts. Live preview your dApp when changes are saved." />
        <Row noGutters
            className={classnames('editor--grid', 'editor--toolbar', {'aside-opened': this.state.currentAsideTab.label})}>
          <Col xs={12}>
            <TextEditorToolbarContainer toggleAsideTab={(newTab) => this.toggleAsideTab(newTab)}
                                        isContract={this.isContract()}
                                        currentFile={this.state.currentFile}
                                        activeTab={this.state.currentAsideTab}/>
          </Col>
        </Row>
        <Row noGutters
             className={classnames('h-100', 'editor--grid', {'aside-opened': this.state.currentAsideTab.label})}>
          <Col className="border-right">
            <FileExplorerContainer showHiddenFiles={this.state.showHiddenFiles}
                                  toggleShowHiddenFiles={() => this.toggleShowHiddenFiles()}/>
          </Col>
          {this.renderTextEditor()}

          {this.renderAside()}
        </Row>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  const currentFile = getCurrentFile(state);
  const debuggerTransactionHash = getDebuggerTransactionHash(props.location);

  return {
    currentFile,
    debuggerTransactionHash,
    transaction: getTransaction(state, debuggerTransactionHash),
    contracts: getContracts(state)
  };
}

EditorContainer.propTypes = {
  debuggerTransactionHash: PropTypes.string,
  contracts: PropTypes.array,
  transaction: PropTypes.object,
  fetchContracts: PropTypes.func,
  fetchFile: PropTypes.func,
  fetchTransaction: PropTypes.func,
  currentFile: PropTypes.object,
  fetchEditorTabs: PropTypes.func
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchEditorTabs: fetchEditorTabsAction.request,
    fetchTransaction: transactionAction.request,
    fetchFile: fileAction.request,
    fetchContracts: contractsAction.request
  },
)(EditorContainer));
