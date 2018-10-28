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

import './EditorContainer.css';

class EditorContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {currentAsideTab: '', showHiddenFiles: false, currentFile: this.props.currentFile};
  }

  componentDidMount() {
    this.props.fetchEditorTabs();
  }

  componentDidUpdate(prevProps) {
    if(this.props.currentFile.path !== prevProps.currentFile.path) {
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
    if (newTab === this.state.currentAsideTab) {
      return this.setState({currentAsideTab: ''});
    }
    this.setState({currentAsideTab: newTab});
  }

  textEditorMdSize() {
    return this.state.currentAsideTab.length ? 7 : 10
  }

  textEditorXsSize() {
    return this.state.currentAsideTab.length ? 2 : 8;
  }

  render() {
    return (
      <Row noGutters className="h-100 editor--grid">
        <Col xs={12}>
          <TextEditorToolbarContainer openAsideTab={(newTab) => this.openAsideTab(newTab)}
                                      isContract={this.isContract()}
                                      currentFile={this.props.currentFile}
                                      activeTab={this.state.currentAsideTab}/>
        </Col>
        <Col xs={4} md={2} xl={2} lg={2} className="border-right">
          <FileExplorerContainer showHiddenFiles={this.state.showHiddenFiles} toggleShowHiddenFiles={() => this.toggleShowHiddenFiles()} />
        </Col>
        <Col xs={this.textEditorXsSize()} md={this.textEditorMdSize()} style={{overflow: 'hidden'}}>
          <TextEditorContainer currentFile={this.props.currentFile} onFileContentChange={(newContent) => this.onFileContentChange(newContent)} />
        </Col>
        {this.state.currentAsideTab && <Col xs={6} md={3} className="editor-aside">
          <TextEditorAsideContainer currentAsideTab={this.state.currentAsideTab} currentFile={this.props.currentFile} />
        </Col>}
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
  {fetchEditorTabs: fetchEditorTabsAction.request},
)(EditorContainer);

