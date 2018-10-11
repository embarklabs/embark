/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  currentFile as currentFileAction,
} from '../actions';
import {getCurrentFile} from '../reducers/selectors';
import Preview from '../components/Preview';

class TextEditorAsideContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {currentFile: this.props.currentFile};
  }

  componentDidMount() {
    this.props.fetchCurrentFile();
  }

  componentDidUpdate(prevProps) {
    if(this.props.currentFile.path !== prevProps.currentFile.path) {
      this.setState({currentFile: this.props.currentFile});
    }
  }

  isContract() {
    return this.state.currentFile.name.endsWith('.sol');
  }

  render() {
    return this.isContract() ? <React.Fragment>hello</React.Fragment> : <Preview />
  }
}

function mapStateToProps(state, props) {
  const currentFile = getCurrentFile(state) || props.defaultFile

  return {
    currentFile,
    loading: state.loading,
    error: state.errorMessage
  };
}

TextEditorAsideContainer.propTypes = {
  currentFile: PropTypes.object,
  fetchCurrentFile: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    fetchCurrentFile: currentFileAction.request,
  },
)(TextEditorAsideContainer);
