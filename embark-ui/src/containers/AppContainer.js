import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";

import routes from '../routes';
import Unauthenticated from '../components/Unauthenticated';
import Layout from "../components/Layout";
import queryString from 'query-string';

import {
  initBlockHeader,
  authenticate, fetchToken, logout,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction
} from '../actions';

import { getToken, getAuthenticationError } from '../reducers/selectors';

class AppContainer extends Component {
  constructor (props) {
    super(props);

    this.queryStringAuthenticate();
  }

  queryStringAuthenticate() {
    if (!this.props.location.search) {
      return;
    }
    const token = queryString.parse(this.props.location.search).token;
    if (token === this.props.token) {
      return;
    }
    this.props.authenticate(token);
  }

  componentDidMount() {
    this.props.fetchToken();
  }

  componentDidUpdate(){
    if (this.props.token) {
      this.props.authenticate(this.props.token);
      this.props.initBlockHeader();
      this.props.fetchProcesses();
      this.props.fetchVersions();
      this.props.fetchPlugins();
    }
  }

  shouldRenderUnauthenticated() {
    return this.props.authenticationError || !this.props.token;
  }

  render() {
    return (
      <Layout logout={this.props.logout}>
        {this.shouldRenderUnauthenticated() ? <Unauthenticated authenticate={this.props.authenticate}
                                                               error={this.props.authenticationError} /> : <React.Fragment>{routes}</React.Fragment>}
      </Layout>
    );
  }
}

AppContainer.propTypes = {
  token: PropTypes.string,
  authenticationError: PropTypes.string,
  authenticate: PropTypes.func,
  logout: PropTypes.func,
  fetchToken: PropTypes.func,
  initBlockHeader: PropTypes.func,
  fetchProcesses: PropTypes.func,
  fetchPlugins: PropTypes.func,
  fetchVersions: PropTypes.func,
  location: PropTypes.object
};

function mapStateToProps(state) {
  return {
    token: getToken(state),
    authenticationError: getAuthenticationError(state)
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    initBlockHeader,
    authenticate: authenticate.request,
    logout: logout.request,
    fetchToken: fetchToken.request,
    fetchProcesses: processesAction.request,
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request
  },
)(AppContainer));
