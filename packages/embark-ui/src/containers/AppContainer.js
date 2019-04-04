import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import routes from '../routes';
import Login from '../components/Login';
import Layout from "../components/Layout";
import {DEFAULT_HOST} from '../constants';
import {getQueryToken, stripQueryToken} from '../utils/utils';
import {Helmet} from "react-helmet";

import {
  authenticate, fetchCredentials, logout,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction,
  changeTheme, fetchTheme
} from '../actions';

import {LIGHT_THEME, DARK_THEME, PAGE_TITLE_PREFIX} from '../constants';

import {
  getCredentials, getAuthenticationError, getProcesses, getTheme
} from '../reducers/selectors';

class AppContainer extends Component {
  componentDidMount() {
    this.props.fetchCredentials();
    this.props.fetchTheme();
  }

  doAuthenticate() {
    let {host, token} = this.props.credentials;
    const queryToken = getQueryToken(this.props.location);

    if (queryToken) {
      host = DEFAULT_HOST;
      token = queryToken;
    }

    this.props.authenticate(host, token);
  }

  requireAuthentication() {
    if (this.props.credentials.authenticating) {
      return false;
    }

    const queryToken = getQueryToken(this.props.location);
    if (queryToken && !(queryToken === this.props.credentials.token &&
      this.props.credentials.host === DEFAULT_HOST)) {
      return true;
    }

    if (!this.props.credentials.authenticated &&
      this.props.credentials.host &&
      this.props.credentials.token) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    if (this.requireAuthentication()) {
      this.doAuthenticate();
    }

    if (getQueryToken(this.props.location) && 
        (!this.props.credentials.authenticating || 
         this.props.credentials.authenticated)) {
      this.props.history.replace(stripQueryToken(this.props.location));
    }

    if (this.props.credentials.authenticated && !this.props.initialized) {
      this.props.fetchPlugins();
      this.props.fetchProcesses();
    }
  }

  shouldRenderLogin() {
    return this.props.authenticationError ||
      !(this.props.credentials.authenticated || this.props.credentials.authenticating);
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
      return (
        <Login credentials={this.props.credentials}
          authenticate={this.props.authenticate}
          error={this.props.authenticationError} />
      );
    } else if (this.props.credentials.authenticating) {
      return <React.Fragment />;
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
    return (
      <div className={(this.props.theme) + "-theme"}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{PAGE_TITLE_PREFIX}</title>
          <meta name="description" content="Interact with a running Embark instance using the Embark Cockpit" />
        </Helmet>
        {this.renderBody()}
      </div>
    );
  }
}

AppContainer.propTypes = {
  credentials: PropTypes.object,
  initialized: PropTypes.bool,
  authenticationError: PropTypes.string,
  authenticate: PropTypes.func,
  logout: PropTypes.func,
  fetchCredentials: PropTypes.func,
  fetchProcesses: PropTypes.func,
  fetchPlugins: PropTypes.func,
  fetchVersions: PropTypes.func,
  location: PropTypes.object,
  theme: PropTypes.string,
  changeTheme: PropTypes.func,
  fetchTheme: PropTypes.func,
  history: PropTypes.object
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
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request,
    changeTheme: changeTheme.request,
    fetchTheme: fetchTheme.request
  },
)(AppContainer));
