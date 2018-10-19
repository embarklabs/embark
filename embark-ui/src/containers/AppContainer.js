import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import routes from '../routes';
import Login from '../components/Login';
import Layout from "../components/Layout";
import { DEFAULT_HOST } from '../constants';

import {
  authenticate, fetchCredentials, logout,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction,
  changeTheme, fetchTheme
} from '../actions';


import {LIGHT_THEME, DARK_THEME} from '../constants';

import { getCredentials, getAuthenticationError, getProcesses, getTheme } from '../reducers/selectors';

const qs = require('qs');

class AppContainer extends Component {
  queryStringAuthenticate() {
    const token = qs.parse(this.props.location.search, {ignoreQueryPrefix: true}).token;

    if (!token) {
      return;
    }
    const host = process.env.NODE_ENV === 'development' ? DEFAULT_HOST : window.location.host;
    if (token === this.props.credentials.token && this.props.credentials.host === host) {
      return;
    }
    return this.props.authenticate(host, token);
  }

  componentDidMount() {
    this.props.fetchCredentials();
    this.props.fetchTheme();
  }

  requireAuthentication() {
    return this.props.credentials.token && this.props.credentials.host && !this.props.credentials.authenticated;
  }

  componentDidUpdate(){
    if (this.requireAuthentication()) {
      if (!this.queryStringAuthenticate()) {
        this.props.authenticate(this.props.credentials.host, this.props.credentials.token);
      }
    }

    if (this.props.credentials.authenticated && !this.props.initialized) {
      this.props.fetchProcesses();
      this.props.fetchServices();
      this.props.fetchPlugins();
    }
  }

  shouldRenderLogin() {
    return this.props.authenticationError || !this.props.credentials.authenticated;
  }

  toggleTheme() {
    if (this.props.theme === LIGHT_THEME) {
      this.props.changeTheme(DARK_THEME);
    } else {
      this.props.changeTheme(LIGHT_THEME);
    }
  }

  renderBody() {
    if (this.shouldRenderLogin()) {
      return <Login credentials={this.props.credentials} authenticate={this.props.authenticate} error={this.props.authenticationError} />;
    }
    return (
      <Layout location={this.props.location} 
              logout={this.props.logout}
              toggleTheme={() => this.toggleTheme()} 
              currentTheme={this.props.theme}>
        <React.Fragment>{routes}</React.Fragment>
      </Layout>
    );
  }

  render() {
    return <div className={(this.props.theme) + "-theme"}>{this.renderBody()}</div>;
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
  fetchServices: PropTypes.func,
  fetchPlugins: PropTypes.func,
  fetchVersions: PropTypes.func,
  location: PropTypes.object,
  theme: PropTypes.string,
  changeTheme: PropTypes.func,
  fetchTheme: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    initialized: getProcesses(state).length > 0,
    credentials: getCredentials(state),
    authenticationError: getAuthenticationError(state),
    theme: getTheme(state),
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    authenticate: authenticate.request,
    logout: logout.request,
    fetchCredentials: fetchCredentials.request,
    fetchProcesses: processesAction.request,
    fetchServices: processesAction.request,
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request,
    changeTheme: changeTheme.request,
    fetchTheme: fetchTheme.request
  },
)(AppContainer));
