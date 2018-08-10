import {ConnectedRouter} from "connected-react-router";
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import React, {Component} from 'react';

import history from '../history';
import Layout from '../components/Layout';
import routes from '../routes';
import {contracts as contractsAction, initBlockHeader, processes as processesAction} from '../actions';

class AppContainer extends Component {
  componentDidMount() {
    this.props.initBlockHeader();
    this.props.fetchProcesses();
    this.props.fetchContracts();
  }

  render() {
    return (
      <ConnectedRouter history={history}>
        <Layout>
          {routes}
        </Layout>
      </ConnectedRouter>
    );
  }
}

AppContainer.propTypes = {
  initBlockHeader: PropTypes.func,
  fetchContracts: PropTypes.func,
  fetchProcesses: PropTypes.func
};

export default connect(
  null,
  {
    initBlockHeader,
    fetchProcesses: processesAction.request,
    fetchContracts: contractsAction.request
  },
)(AppContainer);
