import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {files as filesAction, file as fileAction} from "../actions";

import FileExplorer from '../components/FileExplorer';
import DataWrapper from "../components/DataWrapper";
import {getFiles} from "../reducers/selectors";

class FileExplorerContainer extends Component {
  componentDidMount() {
    this.props.fetchFiles();
  }

  render() {
    return (
      <DataWrapper shouldRender={this.props.files.length > 0} {...this.props} render={({files, fetchFile}) => (
        <FileExplorer files={files} fetchFile={fetchFile} />
      )} />
    );
  }
}

function mapStateToProps(state) {
  return {files: getFiles(state), error: state.errorMessage, loading: state.loading};
}

FileExplorerContainer.propTypes = {
  files: PropTypes.array,
  fetchFiles: PropTypes.func,
  fetchFile: PropTypes.func
};

export default connect(
  mapStateToProps,{
    fetchFiles: filesAction.request,
    fetchFile: fileAction.request
  }
)(FileExplorerContainer);
