import {ConnectedRouter} from "connected-react-router";
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import "tabler-react/dist/Tabler.css";
import "./general.css";
import "./slider.css";
import Layout from "./components/Layout";

import AppContainer from './containers/AppContainer';
import history from "./history";
import registerServiceWorker from './registerServiceWorker';
import configureStore from './store/configureStore';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Layout>
        <AppContainer/>
      </Layout>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);
registerServiceWorker();
