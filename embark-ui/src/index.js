import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import "tabler-react/dist/Tabler.css";
import "./general.css";

import AppContainer from './containers/AppContainer';
import registerServiceWorker from './registerServiceWorker';
import configureStore from './store/configureStore';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('root')
);
registerServiceWorker();
