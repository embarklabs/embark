import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";

import routes from '../routes';
import queryString from 'query-string';

import {
  initBlockHeader,
  authenticate,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction
} from '../actions';

class AppContainer extends Component {
  componentDidMount() {
    this.props.authenticate(queryString.parse(this.props.location.search).token);
    this.props.initBlockHeader();
    this.props.fetchProcesses();
    this.props.fetchVersions();
    this.props.fetchPlugins();
  }

  render() {
    return (<React.Fragment>{routes}</React.Fragment>);
  }
}

AppContainer.propTypes = {
  authenticate: PropTypes.func,
  initBlockHeader: PropTypes.func,
  fetchProcesses: PropTypes.func,
  fetchPlugins: PropTypes.func,
  fetchVersions: PropTypes.func,
  location: PropTypes.object
};

export default withRouter(connect(
  null,
  {
    initBlockHeader,
    authenticate: authenticate.request,
    fetchProcesses: processesAction.request,
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request
  },
)(AppContainer));
