import * as actions from '../actions';
import * as api from '../services/api';
import * as storage from '../services/storage';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeEvery, take} from 'redux-saga/effects';

function *doRequest(entity, serviceFn, payload) {
  const {response, error} = yield call(serviceFn, payload);
  if(response) {
    yield put(entity.success(response.data, payload));
  } else if (error) {
    yield put(entity.failure(error));
  }
}

export const fetchPlugins = doRequest.bind(null, actions.plugins, api.fetchPlugins);
export const fetchVersions = doRequest.bind(null, actions.versions, api.fetchVersions);
export const fetchAccount = doRequest.bind(null, actions.account, api.fetchAccount);
export const fetchBlock = doRequest.bind(null, actions.block, api.fetchBlock);
export const fetchTransaction = doRequest.bind(null, actions.transaction, api.fetchTransaction);
export const fetchAccounts = doRequest.bind(null, actions.accounts, api.fetchAccounts);
export const fetchBlocks = doRequest.bind(null, actions.blocks, api.fetchBlocks);
export const fetchTransactions = doRequest.bind(null, actions.transactions, api.fetchTransactions);
export const fetchProcesses = doRequest.bind(null, actions.processes, api.fetchProcesses);
export const postCommand = doRequest.bind(null, actions.commands, api.postCommand);
export const fetchProcessLogs = doRequest.bind(null, actions.processLogs, api.fetchProcessLogs);
export const fetchContractLogs = doRequest.bind(null, actions.contractLogs, api.fetchContractLogs);
export const fetchContracts = doRequest.bind(null, actions.contracts, api.fetchContracts);
export const fetchContract = doRequest.bind(null, actions.contract, api.fetchContract);
export const fetchContractProfile = doRequest.bind(null, actions.contractProfile, api.fetchContractProfile);
export const postContractFunction = doRequest.bind(null, actions.contractFunction, api.postContractFunction);
export const postContractDeploy = doRequest.bind(null, actions.contractDeploy, api.postContractDeploy);
export const postContractCompile = doRequest.bind(null, actions.contractCompile, api.postContractCompile);
export const sendMessage = doRequest.bind(null, actions.messageSend, api.sendMessage);
export const fetchEnsRecord = doRequest.bind(null, actions.ensRecord, api.fetchEnsRecord);
export const postEnsRecord = doRequest.bind(null, actions.ensRecords, api.postEnsRecord);
export const fetchFiles = doRequest.bind(null, actions.files, api.fetchFiles);
export const fetchFile = doRequest.bind(null, actions.file, api.fetchFile);
export const postFile = doRequest.bind(null, actions.saveFile, api.postFile);
export const deleteFile = doRequest.bind(null, actions.removeFile, api.deleteFile);
export const fetchEthGas = doRequest.bind(null, actions.gasOracle, api.getEthGasAPI);

export const fetchCurrentFile = doRequest.bind(null, actions.currentFile, storage.fetchCurrentFile);
export const postCurrentFile = doRequest.bind(null, actions.saveCurrentFile, storage.postCurrentFile);
export const deleteCurrentFile = doRequest.bind(null, null, storage.deleteCurrentFile);


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

export function *watchFetchProcesses() {
  yield takeEvery(actions.PROCESSES[actions.REQUEST], fetchProcesses);
}

export function *watchPostCommand() {
  yield takeEvery(actions.COMMANDS[actions.REQUEST], postCommand);
}

export function *watchFetchProcessLogs() {
  yield takeEvery(actions.PROCESS_LOGS[actions.REQUEST], fetchProcessLogs);
}

export function *watchFetchContractLogs() {
  yield takeEvery(actions.CONTRACT_LOGS[actions.REQUEST], fetchContractLogs);
}

export function *watchFetchContract() {
  yield takeEvery(actions.CONTRACT[actions.REQUEST], fetchContract);
}

export function *watchFetchContracts() {
  yield takeEvery(actions.CONTRACTS[actions.REQUEST], fetchContracts);
}

export function *watchFetchContractProfile() {
  yield takeEvery(actions.CONTRACT_PROFILE[actions.REQUEST], fetchContractProfile);
}

export function *watchPostContractFunction() {
  yield takeEvery(actions.CONTRACT_FUNCTION[actions.REQUEST], postContractFunction);
}

export function *watchPostContractDeploy() {
  yield takeEvery(actions.CONTRACT_DEPLOY[actions.REQUEST], postContractDeploy);
}

export function *watchPostContractCompile() {
  yield takeEvery(actions.CONTRACT_COMPILE[actions.REQUEST], postContractCompile);
}

export function *watchFetchVersions() {
  yield takeEvery(actions.VERSIONS[actions.REQUEST], fetchVersions);
}

export function *watchFetchPlugins() {
  yield takeEvery(actions.PLUGINS[actions.REQUEST], fetchPlugins);
}

export function *watchSendMessage() {
  yield takeEvery(actions.MESSAGE_SEND[actions.REQUEST], sendMessage);
}

export function *watchFetchEnsRecord() {
  yield takeEvery(actions.ENS_RECORD[actions.REQUEST], fetchEnsRecord);
}

export function *watchPostEnsRecords() {
  yield takeEvery(actions.ENS_RECORDS[actions.REQUEST], postEnsRecord);
}

export function *watchListenToMessages() {
  yield takeEvery(actions.MESSAGE_LISTEN[actions.REQUEST], listenToMessages);
}

export function *watchFetchFiles() {
  yield takeEvery(actions.FILES[actions.REQUEST], fetchFiles);
}

export function *watchFetchFile() {
  yield takeEvery(actions.FILE[actions.REQUEST], fetchFile);
}

export function *watchPostFile() {
  yield takeEvery(actions.SAVE_FILE[actions.REQUEST], postFile);
}

export function *watchDeleteFile() {
  yield takeEvery(actions.REMOVE_FILE[actions.REQUEST], deleteFile);
}

export function *watchDeleteFileSuccess() {
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], fetchFiles);
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], deleteCurrentFile);
}

export function *watchFetchFileSuccess() {
  yield takeEvery(actions.FILE[actions.SUCCESS], postCurrentFile);
}

export function *watchFetchCurrentFile() {
  yield takeEvery(actions.CURRENT_FILE[actions.REQUEST], fetchCurrentFile);
}

export function *watchPostCurrentFile() {
  yield takeEvery(actions.SAVE_CURRENT_FILE[actions.REQUEST], postCurrentFile);
}

export function *watchFetchEthGas() {
  yield takeEvery(actions.GAS_ORACLE[actions.REQUEST], fetchEthGas);
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
    const processLog = yield take(channel);
    yield put(actions.processLogs.success([processLog]));
  }
}

export function *watchListenToProcessLogs() {
  yield takeEvery(actions.WATCH_NEW_PROCESS_LOGS, listenToProcessLogs);
}

export function *listenToContractLogs() {
  const socket = api.webSocketContractLogs();
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractLog = yield take(channel);
    yield put(actions.contractLogs.success([contractLog]));
  }
}

export function *watchListenToContractLogs() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_LOGS, listenToContractLogs);
}

export function *listenGasOracle() {
  const socket = api.websocketGasOracle();
  const channel = yield call(createChannel, socket);
  while (true) {
    const gasOracleStats = yield take(channel);
    yield put(actions.gasOracle.success(gasOracleStats));
  }
}

export function *watchListenGasOracle() {
  yield takeEvery(actions.WATCH_GAS_ORACLE, listenGasOracle);
}

export function *listenToMessages(action) {
  const socket = api.listenToChannel(action.messageChannels[0]);
  const channel = yield call(createChannel, socket);
  while (true) {
    const message = yield take(channel);
    yield put(actions.messageListen.success([{channel: action.messageChannels[0], message: message.data, time: message.time}]));
  }
}

export default function *root() {
  yield all([
    fork(watchInitBlockHeader),
    fork(watchFetchAccounts),
    fork(watchFetchAccount),
    fork(watchFetchProcesses),
    fork(watchFetchProcessLogs),
    fork(watchFetchContractLogs),
    fork(watchListenToProcessLogs),
    fork(watchListenToContractLogs),
    fork(watchFetchBlock),
    fork(watchFetchTransactions),
    fork(watchPostCommand),
    fork(watchFetchVersions),
    fork(watchFetchPlugins),
    fork(watchFetchBlocks),
    fork(watchFetchContracts),
    fork(watchFetchContractProfile),
    fork(watchPostContractFunction),
    fork(watchPostContractDeploy),
    fork(watchPostContractCompile),
    fork(watchListenToMessages),
    fork(watchSendMessage),
    fork(watchFetchContract),
    fork(watchFetchTransaction),
    fork(watchFetchEnsRecord),
    fork(watchPostEnsRecords),
    fork(watchFetchFiles),
    fork(watchFetchFile),
    fork(watchPostFile),
    fork(watchDeleteFile),
    fork(watchDeleteFileSuccess),
    fork(watchFetchFileSuccess),
    fork(watchFetchCurrentFile),
    fork(watchPostCurrentFile),
    fork(watchFetchEthGas),
    fork(watchListenGasOracle)
  ]);
}
