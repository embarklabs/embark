import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import {Page} from "tabler-react";

import {file as FileAction} from '../actions';
import DataWrapper from "../components/DataWrapper";
import TextEditor from "../components/TextEditor";
import {getContract, getCurrentFile} from "../reducers/selectors";

class ContractSourceContainer extends Component {
  componentDidMount() {
    this.props.fetchFile({path: this.props.contract.path});
  }

  render() {
    return (
      <Page.Content title={`${this.props.contract.className} Source`}>
        <DataWrapper shouldRender={this.props.file !== undefined } {...this.props} render={({file}) => (
          <TextEditor value={file.content} contractCompile={{}} />
        )} />
      </Page.Content>
    );
  }
}

function mapStateToProps(state, props) {
  const contract = getContract(state, props.match.params.contractName);
  const file = getCurrentFile(state);

  return {
    contract,
    file,
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractSourceContainer.propTypes = {
  match: PropTypes.object,
  contract: PropTypes.object,
  file: PropTypes.object,
  fetchFile: PropTypes.func,
  error: PropTypes.string
};

export default withRouter(connect(
  mapStateToProps,
  {
    fetchFile: FileAction.request
  }
)(ContractSourceContainer));
