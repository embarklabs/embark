import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {files as filesAction, file as fileAction} from "../actions";
import FileExplorer from '../components/FileExplorer';
import DataWrapper from "../components/DataWrapper";
import {getFiles, getTheme} from "../reducers/selectors";

class FileExplorerContainer extends Component {
  componentDidMount() {
    this.props.fetchFiles();
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.files.length > 0} {...this.props} render={({files, fetchFile, showHiddenFiles, toggleShowHiddenFiles, theme}) => (
        <FileExplorer files={files}
                      fetchFile={fetchFile}
                      showHiddenFiles={showHiddenFiles}
                      toggleShowHiddenFiles={toggleShowHiddenFiles}
                      theme={theme} />
      )} />
    );
  }
}

function mapStateToProps(state) {
  return {files: getFiles(state), theme: getTheme(state)};
}

FileExplorerContainer.propTypes = {
  files: PropTypes.array,
  fetchFiles: PropTypes.func,
  fetchFile: PropTypes.func,
  showHiddenFiles: PropTypes.bool,
  toggleShowHiddenFiles: PropTypes.func,
  theme: PropTypes.string
};

export default connect(
  mapStateToProps,{
    fetchFiles: filesAction.request,
    fetchFile: fileAction.request
  }
)(FileExplorerContainer);
