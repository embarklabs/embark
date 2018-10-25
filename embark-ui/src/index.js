import {ConnectedRouter} from "connected-react-router";
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

// CoreUI Icons Set
import '@coreui/icons/css/coreui-icons.min.css';
// Import Flag Icons Set
// import 'flag-icon-css/css/flag-icon.min.css';
// Icons
import 'font-awesome/css/font-awesome.min.css';
// Import Simple Line Icons Set
import 'simple-line-icons/css/simple-line-icons.css';
// Light theme
import '@coreui/coreui/dist/css/coreui.min.css';
// Dark theme
import './css/coreui-dark.css';
// Custom icons set from https://github.com/file-icons/atom
import './css/icons.css';

// Custom style
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
