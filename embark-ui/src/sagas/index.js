import * as actions from '../actions';
import * as api from '../api';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeEvery, take} from 'redux-saga/effects';

export function *fetchTransaction(payload) {
  try {
    const transaction = yield call(api.fetchTransaction, payload.hash);
    yield put(actions.receiveTransaction(transaction));
  } catch (e) {
    yield put(actions.receiveTransactionError());
  }
}

export function *watchFetchTransaction() {
  yield takeEvery(actions.FETCH_TRANSACTION, fetchTransaction);
}

export function *fetchTransactions(payload) {
  try {
    const transactions = yield call(api.fetchTransactions, payload.blockFrom);
    yield put(actions.receiveTransactions(transactions));
  } catch (e) {
    yield put(actions.receiveTransactionsError());
  }
}

export function *watchFetchTransactions() {
  yield takeEvery(actions.FETCH_TRANSACTIONS, fetchTransactions);
}

export function *fetchBlock(payload) {
  try {
    const block = yield call(api.fetchBlock, payload.blockNumber);
    yield put(actions.receiveBlock(block));
  } catch (e) {
    yield put(actions.receiveBlockError());
  }
}

export function *watchFetchBlock() {
  yield takeEvery(actions.FETCH_BLOCK, fetchBlock);
}

export function *fetchBlocks(payload) {
  try {
    const blocks = yield call(api.fetchBlocks, payload.from);
    yield put(actions.receiveBlocks(blocks));
  } catch (e) {
    yield put(actions.receiveBlocksError());
  }
}

export function *watchFetchBlocks() {
  yield takeEvery(actions.FETCH_BLOCKS, fetchBlocks);
}

export function *fetchAccount(payload) {
  try {
    const account = yield call(api.fetchAccounts, payload.address);
    yield put(actions.receiveAccount(account));
  } catch (e) {
    yield put(actions.receiveAccountError());
  }
}

export function *watchFetchAccount() {
  yield takeEvery(actions.FETCH_ACCOUNT, fetchAccount);
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
    yield put({type: actions.FETCH_BLOCKS});
    yield put({type: actions.FETCH_TRANSACTIONS});
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
