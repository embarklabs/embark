import {ConnectedRouter} from "connected-react-router";
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import 'font-awesome/css/font-awesome.min.css';
import './coreui.css';
// import './dark-theme/coreui-standalone.scss';
// import '@coreui/coreui/dist/css/coreui.min.css';
import './index.css';

import AppContainer from './containers/AppContainer';
import history from "./history";
import registerServiceWorker from './registerServiceWorker';
import configureStore from './store/configureStore';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <AppContainer/>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);
registerServiceWorker();
