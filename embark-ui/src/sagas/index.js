import * as actions from '../actions';
import * as api from '../api';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeEvery, take} from 'redux-saga/effects';

const {account, accounts, block, blocks, transaction, transactions} = actions;

function *fetchEntity(entity, apiFn, id) {
  const {response, error} = yield call(apiFn, id);
  if(response) {
    yield put(entity.success(response));
  } else {
    yield put(entity.failure(error));
  }
}

export const fetchAccount = fetchEntity.bind(null, account, api.fetchAccount);
export const fetchBlock = fetchEntity.bind(null, block, api.fetchBlock);
export const fetchTransaction = fetchEntity.bind(null, transaction, api.fetchTransaction);
export const fetchAccounts = fetchEntity.bind(null, accounts, api.fetchAccounts);
export const fetchBlocks = fetchEntity.bind(null, blocks, api.fetchBlocks);
export const fetchTransactions = fetchEntity.bind(null, transactions, api.fetchTransactions);

export function *watchFetchTransaction() {
  yield takeEvery(actions.TRANSACTION[actions.REQUEST], fetchTransaction);
}

export function *watchFetchTransactions() {
  yield takeEvery(actions.TRANSACTIONS[actions.REQUEST], fetchTransactions);
}

export function *watchFetchBlock() {
  yield takeEvery(actions.BLOCK[actions.REQUEST], fetchBlock);
}

export function *watchFetchBlocks() {
  yield takeEvery(actions.BLOCKS[actions.REQUEST], fetchBlocks);
}

export function *watchFetchAccount() {
  yield takeEvery(actions.ACCOUNT[actions.REQUEST], fetchAccount);
}

export function *watchFetchAccounts() {
  yield takeEvery(actions.ACCOUNTS[actions.REQUEST], fetchAccounts);
}

export function *fetchProcesses() {
  try {
    const processes = yield call(api.fetchProcesses);
    yield put(actions.receiveProcesses(processes));
  } catch (e) {
    yield put(actions.receiveProcessesError(e));
  }
}

export function *watchFetchProcesses() {
  yield takeEvery(actions.FETCH_PROCESSES, fetchProcesses);
}

export function *fetchProcessLogs(action) {
  try {
    const logs = yield call(api.fetchProcessLogs, action.processName);
    yield put(actions.receiveProcessLogs(action.processName, logs));
  } catch (e) {
    yield put(actions.receiveProcessLogsError(e));
  }
}

export function *watchFetchProcessLogs() {
  yield takeEvery(actions.FETCH_PROCESS_LOGS, fetchProcessLogs);
}

function createChannel(socket) {
  return eventChannel(emit => {
    socket.onmessage = ((message) => {
      emit(JSON.parse(message.data));
    });
    return () => {
      socket.close();
    };
  });
}

export function *initBlockHeader() {
  const socket = api.webSocketBlockHeader();
  const channel = yield call(createChannel, socket);
  while (true) {
    yield take(channel);
    yield put({type: actions.BLOCKS[actions.REQUEST]});
    yield put({type: actions.TRANSACTIONS[actions.REQUEST]});
  }
}

export function *watchInitBlockHeader() {
  yield takeEvery(actions.INIT_BLOCK_HEADER, initBlockHeader);
}

export function *listenToProcessLogs(action) {
  const socket = api.webSocketProcess(action.processName);
  const channel = yield call(createChannel, socket);
  while (true) {
    const log = yield take(channel);
    yield put({type: actions.RECEIVE_NEW_PROCESS_LOG, processName: action.processName, log});
  }
}

export function *watchListenToProcessLogs() {
  yield takeEvery(actions.WATCH_NEW_PROCESS_LOGS, listenToProcessLogs);
}

export default function *root() {
  yield all([
    fork(watchInitBlockHeader),
    fork(watchFetchAccounts),
    fork(watchFetchAccount),
    fork(watchFetchProcesses),
    fork(watchFetchProcessLogs),
    fork(watchListenToProcessLogs),
    fork(watchFetchBlocks),
    fork(watchFetchBlock),
    fork(watchFetchTransactions),
    fork(watchFetchTransaction)
  ]);
}
