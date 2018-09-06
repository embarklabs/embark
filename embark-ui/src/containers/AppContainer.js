import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";

import routes from '../routes';
import queryString from 'query-string';
import {put as cachePut, get as cacheGet} from '../services/cache';

import {
  initBlockHeader,
  authenticate,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction
} from '../actions';

class AppContainer extends Component {
  componentDidMount() {
    let token;
    if (this.props.location.search) {
      token = queryString.parse(this.props.location.search).token;
      cachePut('token', token);
    } else {
      token = cacheGet('token');
    }
    this.props.authenticate(token);
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
