import {applyMiddleware, compose, createStore} from 'redux';
import {connectRouter, routerMiddleware} from 'connected-react-router';
import createSagaMiddleware from 'redux-saga';

import history from '../history';
import rootReducer from '../reducers';
import saga from '../sagas';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    connectRouter(history)(rootReducer),
    composeEnhancers(
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      ),
    ),
  );
  sagaMiddleware.run(saga);

  return store;
}
