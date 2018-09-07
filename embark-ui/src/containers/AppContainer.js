import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import {Alert, Page, Form, Button} from "tabler-react";

import routes from '../routes';
import queryString from 'query-string';

import {
  initBlockHeader,
  authorize, getToken, postToken,
  processes as processesAction,
  versions as versionsAction,
  plugins as pluginsAction
} from '../actions';

class AppContainer extends Component {
  constructor (props) {
    super(props);
    this.state = {
      authenticateError: null
    };

    this.checkToken();
  }

  checkToken() {
    if (this.props.location.search) {
      const token = queryString.parse(this.props.location.search).token;
      this.props.postToken(token);
      return this.props.authorize(token, this.authCallback.bind(this));
    }
    this.props.getToken((err, token) => {
      this.props.authorize(token, this.authCallback.bind(this));
    });
  }

  authCallback(err) {
    if (err) {
      return this.setState({authenticateError: err});
    }
    this.setState({authenticateError: null});
  }

  componentDidMount() {
    this.props.initBlockHeader();
    this.props.fetchProcesses();
    this.props.fetchVersions();
    this.props.fetchPlugins();
  }

  render() {
    if (this.state.authenticateError) {
      return <Page.Content>
        <Alert type="danger">
          {this.state.authenticateError}
        </Alert>
        <Form>
          <Form.Input name="token" label="Token" placeholder="Enter Token"/>
          <Button type="submit" color="primary">
            Authorize
          </Button>
        </Form>
      </Page.Content>;
    }
    return (<React.Fragment>{routes}</React.Fragment>);
  }
}

AppContainer.propTypes = {
  authorize: PropTypes.func,
  getToken: PropTypes.func,
  postToken: PropTypes.func,
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
    authorize: authorize.request,
    getToken: getToken.request,
    postToken: postToken.request,
    fetchProcesses: processesAction.request,
    fetchVersions: versionsAction.request,
    fetchPlugins: pluginsAction.request
  },
)(AppContainer));
