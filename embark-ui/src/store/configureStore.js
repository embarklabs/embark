import {applyMiddleware, compose, createStore} from 'redux';
import {connectRouter, routerMiddleware} from 'connected-react-router';
import createSagaMiddleware from 'redux-saga';

import history from '../history';
import rootReducer from '../reducers';
import saga from '../sagas';

export default function configureStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    connectRouter(history)(rootReducer),
    compose(
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      ),
    ),
  );
  sagaMiddleware.run(saga);

  return store;
}
