import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import routes from '../routes';
import Unauthenticated from '../components/Unauthenticated';
import Layout from "../components/Layout";
import LoginLayout from '../components/LoginLayout';

import {
  authenticate, fetchCredentials, logout,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction
} from '../actions';

import { getCredentials, getAuthenticationError, getVersions } from '../reducers/selectors';

const qs = require('qs');

class AppContainer extends Component {
  constructor (props) {
    super(props);

    this.queryStringAuthenticate();
  }

  queryStringAuthenticate() {
    if (!this.props.location.search) {
      return;
    }
    const token = qs.parse(this.props.location.search, {ignoreQueryPrefix: true}).token;
    const host = window.location.host;
    if (token === this.props.credentials.token && this.props.credentials.host === host) {
      return;
    }
    this.props.authenticate(host, token);
  }

  componentDidMount() {
    this.props.fetchCredentials();
  }

  requireAuthentication() {
    return this.props.credentials.token && this.props.credentials.host && !this.props.credentials.authenticated;
  }

  componentDidUpdate(){
    if (this.requireAuthentication()) {
      this.props.authenticate(this.props.credentials.host, this.props.credentials.token);
    }

    if (this.props.credentials.authenticated && !this.props.initialized) {
      this.props.fetchProcesses();
      this.props.fetchVersions();
      this.props.fetchPlugins();
    }
  }

  shouldRenderUnauthenticated() {
    return this.props.authenticationError || !this.props.credentials.authenticated;
  }

  render() {
    return (
      <React.Fragment>
        {this.shouldRenderUnauthenticated() ?
          <LoginLayout>
            <Unauthenticated credentials={this.props.credentials} authenticate={this.props.authenticate} error={this.props.authenticationError} />
          </LoginLayout>
          :
          <Layout location={this.props.location} logout={this.props.logout} credentials={this.props.credentials}>
            <React.Fragment>{routes}</React.Fragment>
          </Layout>
        }
      </React.Fragment>
    )
  }
}

AppContainer.propTypes = {
  credentials: PropTypes.object,
  initialized: PropTypes.bool,
  authenticationError: PropTypes.string,
  authenticate: PropTypes.func,
  logout: PropTypes.func,
  fetchCredentials: PropTypes.func,
  initBlockHeader: PropTypes.func,
  fetchProcesses: PropTypes.func,
  fetchPlugins: PropTypes.func,
  fetchVersions: PropTypes.func,
  location: PropTypes.object
};

function mapStateToProps(state) {
  return {
    initialized: getVersions(state).length > 0,
    credentials: getCredentials(state),
    authenticationError: getAuthenticationError(state)
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    authenticate: authenticate.request,
    logout: logout.request,
    fetchCredentials: fetchCredentials.request,
    fetchProcesses: processesAction.request,
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request
  },
)(AppContainer));
