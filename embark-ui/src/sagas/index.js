import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import * as actions from '../actions';
import * as api from '../api';

export function *fetchAccounts() {
  try {
    const accounts = yield call(api.fetchAccounts);
    yield put(actions.receiveAccounts(accounts));
  } catch (e) {
    yield put(actions.receiveAccountsError());
  }
}

export function *watchFetchAccounts() {
  yield takeEvery(actions.FETCH_ACCOUNTS, fetchAccounts);
}

export default function *root() {
  yield all([fork(watchFetchAccounts)]);
}
