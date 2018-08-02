import * as actions from '../actions';
import * as api from '../api';
import {all, call, fork, put, takeEvery} from 'redux-saga/effects';

export function *fetchBlocks() {
  try {
    const blocks = yield call(api.fetchBlocks);
    yield put(actions.receiveBlocks(blocks));
  } catch (e) {
    yield put(actions.receiveBlocksError());
  }
}

export function *watchFetchBlocks() {
  yield takeEvery(actions.FETCH_BLOCKS, fetchBlocks);
}

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

export function *fetchProcesses() {
  try {
    const processes = yield call(api.fetchProcesses);
    yield put(actions.receiveProcesses(processes));
  } catch (e) {
    yield put(actions.receiveProcessesError());
  }
}

export function *watchFetchProcesses() {
  yield takeEvery(actions.FETCH_PROCESSES, fetchProcesses);
}

export default function *root() {
  yield all([fork(watchFetchAccounts), fork(watchFetchProcesses), fork(watchFetchBlocks)]);
}
