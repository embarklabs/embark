/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Grid} from 'tabler-react';
import TextEditor from '../components/TextEditor';
import TextEditorContractErrors from '../components/TextEditorContractErrors';
import TextEditorContractWarnings from '../components/TextEditorContractWarnings';
import TextEditorContractToolbar from '../components/TextEditorContractToolbar';
import TextEditorContractDeploy from '../components/TextEditorContractDeploy';
import TextEditorToolbar from '../components/TextEditorToolbar';
import {
  currentFile as currentFileAction,
  saveCurrentFile as saveCurrentFileAction,
  saveFile as saveFileAction,
  removeFile as removeFileAction,
  contractCompile as contractCompileAction,
  contractDeploy as contractDeployAction
} from '../actions';
import {getCurrentFile, getContractCompile} from '../reducers/selectors';

const DEFAULT_FILE = {name: 'newContract.sol', content: ''};

class TextEditorContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {currentFile: this.props.currentFile};
  }

  componentDidMount() {
    if(this.props.currentFile.content === '') {
      this.props.fetchCurrentFile();
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }
  }

  isContract() {
    return this.state.currentFile.name.endsWith('.sol');
  }

  onFileContentChange(newContent) {
    const newCurrentFile = this.state.currentFile;
    newCurrentFile.content = newContent;
    this.setState({currentFile: newCurrentFile});
    if (!this.isContract()) return;

    this.compileTimeout = setTimeout(() => {
      this.props.compileContract(newContent, this.state.currentFile.name);
    }, 1000);
  }

  save() {
    this.props.saveFile(this.state.currentFile);
    this.props.saveCurrentFile(this.state.currentFile);
  }

  remove() {
    this.props.removeFile(this.state.currentFile);
    this.setState({currentFile: DEFAULT_FILE});
  }

  renderContractFooter() {
    if (!this.isContract()) return <React.Fragment />;
    let components = [];

    const {errors, warnings, result} = this.props.contractCompile;
    if (errors && errors.length > 0) {
      components.push(<TextEditorContractErrors key={1} errors={errors} />);
    }

    if (warnings && warnings.length > 0) {
      components.push(<TextEditorContractWarnings key={2} warnings={warnings} />);
    }

    if (result) {
      components.push(<TextEditorContractDeploy key={3} result={result}/>);
    }
    return <React.Fragment>{components}</React.Fragment>;
  }

  renderToolbar(){
    if (this.isContract()) {
      return <TextEditorContractToolbar currentFile={this.state.currentFile}
                                        contractCompile={this.props.contractCompile}
                                        compilingContract={this.props.compilingContract}
                                        save={() => this.save()}
                                        remove={() => this.remove()} />;
    }
    return <TextEditorToolbar currentFile={this.state.currentFile}
                              contractCompile={this.props.contractCompile}
                              save={() => this.save()}
                              remove={() => this.remove()} />;
  }

  render() {
    return (
      <React.Fragment>
        <Grid.Row className="my-2">
          {this.renderToolbar()}
        </Grid.Row>
        <TextEditor value={this.state.currentFile.content}
                    contractCompile={this.props.contractCompile}
                    onFileContentChange={(newContent) => this.onFileContentChange(newContent)} />
        {this.renderContractFooter()}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const currentFile = getCurrentFile(state) || DEFAULT_FILE;
  const contractCompile = getContractCompile(state, currentFile) || {};
  return {
    currentFile,
    contractCompile,
    compilingContract: state.compilingContract,
    loading: state.loading,
    error: state.errorMessage
  };
}

TextEditorContainer.propTypes = {
  currentFile: PropTypes.object,
  contractCompile: PropTypes.object,
  saveCurrentFile: PropTypes.func,
  fetchCurrentFile: PropTypes.func,
  saveFile: PropTypes.func,
  removeFile: PropTypes.func,
  deployContract: PropTypes.func,
  compileContract: PropTypes.func,
  compilingContract: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    fetchCurrentFile: currentFileAction.request,
    saveCurrentFile: saveCurrentFileAction.request,
    saveFile: saveFileAction.request,
    removeFile: removeFileAction.request,
    deployContract: contractDeployAction.post,
    compileContract: contractCompileAction.post
  },
)(TextEditorContainer);
