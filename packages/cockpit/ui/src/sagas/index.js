import * as actions from '../actions';
import * as api from '../services/api';
import * as storage from '../services/storage';
import * as web3Service from '../services/web3';
import {eventChannel} from 'redux-saga';
import {all, call, fork, put, takeLatest, takeEvery, take, select, race} from 'redux-saga/effects';
import {getCredentials, getWeb3, getContracts} from '../reducers/selectors';
import { DEPLOYMENT_PIPELINES } from '../constants';
import {searchExplorer} from './searchSaga';

function *doRequest(entity, serviceFn, payload) {
  payload.credentials = yield select(getCredentials);
  const {response, error} = yield call(serviceFn, payload);
  if(response) {
    yield put(entity.success(response.data, payload));
  } else if (error) {
    yield put(entity.failure(error.message || error));
  }
}

function *doWeb3Request(entity, serviceFn, payload) {
  payload.web3 = yield select(getWeb3);
  if(payload.type === actions.WEB3_DEPLOY[actions.SUCCESS]) {
    payload.contract.deployedAddress = payload.receipt.contractAddress;
  }
  try {
    const result = yield call(serviceFn, payload);
    yield put(entity.success(result, payload));
  } catch (error) {
    yield put(entity.failure(error.message, payload));
  }
}

function *web3Connect(action) {
  if (action.payload !== DEPLOYMENT_PIPELINES.injectedWeb3) return;
  if (yield select(getWeb3)) return;

  try {
    const web3 = yield call(web3Service.connect);
    yield put(actions.web3Connect.success(web3));
  } catch(error) {
    yield put(actions.web3Connect.failure(error));
  }
}

function *web3ContractsDeployed(action) {
  const contracts = yield select(getContracts);
  let i = 0;
  while(i < contracts.length) {
    yield put(actions.web3IsDeployed.request(contracts[i++]));
  }
}

export const fetchPlugins = doRequest.bind(null, actions.plugins, api.fetchPlugins);
export const fetchVersions = doRequest.bind(null, actions.versions, api.fetchVersions);
export const fetchAccount = doRequest.bind(null, actions.account, api.fetchAccount);
export const fetchBlock = doRequest.bind(null, actions.block, api.fetchBlock);
export const fetchTransaction = doRequest.bind(null, actions.transaction, api.fetchTransaction);
export const fetchAccounts = doRequest.bind(null, actions.accounts, api.fetchAccounts);
export const fetchBlocks = doRequest.bind(null, actions.blocks, api.fetchBlocks);
export const fetchBlocksFull = doRequest.bind(null, actions.blocksFull, api.fetchBlocks);
export const fetchTransactions = doRequest.bind(null, actions.transactions, api.fetchTransactions);
export const fetchProcesses = doRequest.bind(null, actions.processes, api.fetchProcesses);
export const fetchServices = doRequest.bind(null, actions.services, api.fetchServices);
export const postCommand = doRequest.bind(null, actions.commands, api.postCommand);
export const postCommandSuggestions = doRequest.bind(null, actions.commandSuggestions, api.postCommandSuggestions);
export const fetchProcessLogs = doRequest.bind(null, actions.processLogs, api.fetchProcessLogs);
export const fetchContractEvents = doRequest.bind(null, actions.contractEvents, api.fetchContractEvents);
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
export const postFolder = doRequest.bind(null, actions.saveFolder, api.postFolder);
export const deleteFile = doRequest.bind(null, actions.removeFile, api.deleteFile);
export const fetchEthGas = doRequest.bind(null, actions.gasOracle, api.getEthGasAPI);
export const startDebug = doRequest.bind(null, actions.startDebug, api.startDebug);
export const stopDebug = doRequest.bind(null, actions.stopDebug, api.stopDebug);
export const debugJumpBack = doRequest.bind(null, actions.debugJumpBack, api.debugJumpBack);
export const debugJumpForward = doRequest.bind(null, actions.debugJumpForward, api.debugJumpForward);
export const debugStepOverForward = doRequest.bind(null, actions.debugStepOverForward, api.debugStepOverForward);
export const debugStepOverBackward = doRequest.bind(null, actions.debugStepOverBackward, api.debugStepOverBackward);
export const debugStepIntoForward = doRequest.bind(null, actions.debugStepIntoForward, api.debugStepIntoForward);
export const debugStepIntoBackward = doRequest.bind(null, actions.debugStepIntoBackward, api.debugStepIntoBackward);
export const toggleBreakpoint = doRequest.bind(null, actions.toggleBreakpoint, api.toggleBreakpoint);
export const authenticate = doRequest.bind(null, actions.authenticate, api.authenticate);
export const decodeTransaction = doRequest.bind(null, actions.decodedTransaction, api.fetchTransaction);

export const fetchCredentials = doRequest.bind(null, actions.fetchCredentials, storage.fetchCredentials);
export const saveCredentials = doRequest.bind(null, actions.saveCredentials, storage.saveCredentials);
export const logout = doRequest.bind(null, actions.logout, storage.logout);
export const changeTheme = doRequest.bind(null, actions.changeTheme, storage.changeTheme);
export const fetchTheme = doRequest.bind(null, actions.fetchTheme, storage.fetchTheme);
export const signMessage = doRequest.bind(null, actions.signMessage, api.signMessage);
export const verifyMessage = doRequest.bind(null, actions.verifyMessage, api.verifyMessage);
export const fetchEditorTabs = doRequest.bind(null, actions.fetchEditorTabs, storage.fetchEditorTabs);
export const addEditorTabs = doRequest.bind(null, actions.addEditorTabs, storage.addEditorTabs);
export const removeEditorTabs = doRequest.bind(null, actions.removeEditorTabs, storage.removeEditorTabs);
export const updateEditorTabs = doRequest.bind(null, actions.updateEditorTabs, storage.updateEditorTabs);

export const explorerSearch = searchExplorer.bind(null, actions.explorerSearch);

export const web3Deploy = doWeb3Request.bind(null, actions.web3Deploy, web3Service.deploy);
export const web3EstimateGas = doWeb3Request.bind(null, actions.web3EstimateGas, web3Service.estimateGas);
export const web3IsDeployed = doWeb3Request.bind(null, actions.web3IsDeployed, web3Service.isDeployed);


export function *watchFetchTransaction() {
  yield takeEvery(actions.TRANSACTION[actions.REQUEST], fetchTransaction);
}

export function *watchDecodeTransaction() {
  yield takeEvery(actions.DECODED_TRANSACTION[actions.REQUEST], decodeTransaction);
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

export function *watchFetchBlocksFull() {
  yield takeEvery(actions.BLOCKS_FULL[actions.REQUEST], fetchBlocksFull);
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

export function *watchFetchServices() {
  yield takeLatest(actions.PROCESSES[actions.REQUEST], fetchServices);
}

export function *watchPostCommand() {
  yield takeEvery(actions.COMMANDS[actions.REQUEST], postCommand);
}

export function *watchPostCommandSuggestions() {
  yield takeLatest(actions.COMMAND_SUGGESTIONS[actions.REQUEST], postCommandSuggestions);
}

export function *watchFetchProcessLogs() {
  yield takeEvery(actions.PROCESS_LOGS[actions.REQUEST], fetchProcessLogs);
}

export function *watchFetchContractLogs() {
  yield takeEvery(actions.CONTRACT_LOGS[actions.REQUEST], fetchContractLogs);
}

export function *watchFetchContractEvents() {
  yield takeEvery(actions.CONTRACT_EVENTS[actions.REQUEST], fetchContractEvents);
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

export function *watchPostFileSuccess() {
  yield takeEvery(actions.SAVE_FILE[actions.SUCCESS], fetchFiles);
  yield takeEvery(actions.SAVE_FILE[actions.SUCCESS], addEditorTabs);
}

export function *watchPostFolder() {
  yield takeEvery(actions.SAVE_FOLDER[actions.REQUEST], postFolder);
}

export function *watchPostFolderSuccess() {
  yield takeEvery(actions.SAVE_FOLDER[actions.SUCCESS], fetchFiles);
}

export function *watchDeleteFile() {
  yield takeEvery(actions.REMOVE_FILE[actions.REQUEST], deleteFile);
}

export function *watchDeleteFileSuccess() {
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], fetchFiles);
  yield takeEvery(actions.REMOVE_FILE[actions.SUCCESS], removeEditorTabs);
}

export function *watchFetchFileSuccess() {
  yield takeEvery(actions.FILE[actions.SUCCESS], addEditorTabs);
}

export function *watchFetchEthGas() {
  yield takeEvery(actions.GAS_ORACLE[actions.REQUEST], fetchEthGas);
}

export function *watchStartDebug() {
  yield takeEvery(actions.START_DEBUG[actions.REQUEST], startDebug);
}

export function *watchStopDebug() {
  yield takeEvery(actions.STOP_DEBUG[actions.REQUEST], stopDebug);
}

export function *watchDebugJumpBack() {
  yield takeEvery(actions.DEBUG_JUMP_BACK[actions.REQUEST], debugJumpBack);
}

export function *watchDebugJumpForward() {
  yield takeEvery(actions.DEBUG_JUMP_FORWARD[actions.REQUEST], debugJumpForward);
}

export function *watchDebugStepOverForward() {
  yield takeEvery(actions.DEBUG_STEP_OVER_FORWARD[actions.REQUEST], debugStepOverForward);
}

export function *watchDebugStepOverBackward() {
  yield takeEvery(actions.DEBUG_STEP_OVER_BACKWARD[actions.REQUEST], debugStepOverBackward);
}

export function *watchDebugStepIntoForward() {
  yield takeEvery(actions.DEBUG_STEP_INTO_FORWARD[actions.REQUEST], debugStepIntoForward);
}

export function *watchDebugStepIntoBackward() {
  yield takeEvery(actions.DEBUG_STEP_INTO_BACKWARD[actions.REQUEST], debugStepIntoBackward);
}

export function *watchToggleBreakpoint() {
  yield takeEvery(actions.TOGGLE_BREAKPOINT[actions.REQUEST], toggleBreakpoint);
}

export function *watchAuthenticate() {
  yield takeEvery(actions.AUTHENTICATE[actions.REQUEST], authenticate);
}

export function *watchChangeTheme() {
  yield takeEvery(actions.CHANGE_THEME[actions.REQUEST], changeTheme);
}

export function *watchFetchTheme() {
  yield takeEvery(actions.FETCH_THEME[actions.REQUEST], fetchTheme);
}

export function *watchAuthenticateSuccess() {
  yield takeEvery(actions.AUTHENTICATE[actions.SUCCESS], saveCredentials);
}

export function *watchAuthenticateFailure() {
  yield takeEvery(actions.AUTHENTICATE[actions.FAILURE], logout);
}

export function *watchFetchCredentials() {
  yield takeEvery(actions.FETCH_CREDENTIALS[actions.REQUEST], fetchCredentials);
}

export function *watchLogout() {
  yield takeEvery(actions.LOGOUT[actions.REQUEST], logout);
}

export function *watchExplorerSearch() {
  yield takeEvery(actions.EXPLORER_SEARCH[actions.REQUEST], explorerSearch);
}

export function *watchSignMessage() {
  yield takeEvery(actions.SIGN_MESSAGE[actions.REQUEST], signMessage);
}

export function *watchVerifyMessage() {
  yield takeEvery(actions.VERIFY_MESSAGE[actions.REQUEST], verifyMessage);
}

export function *watchWeb3Deploy() {
  yield takeEvery(actions.WEB3_DEPLOY[actions.REQUEST], web3Deploy);
  yield takeEvery(actions.WEB3_DEPLOY[actions.SUCCESS], web3IsDeployed);
}

export function *watchWeb3EstimateGas() {
  yield takeEvery(actions.WEB3_ESTIMAGE_GAS[actions.REQUEST], web3EstimateGas);
}

export function *watchWeb3IsDeployed() {
  yield takeEvery(actions.WEB3_IS_DEPLOYED[actions.REQUEST], web3IsDeployed);
}

export function *watchUpdateDeploymentPipeline() {
  yield takeEvery(actions.UPDATE_DEPLOYMENT_PIPELINE, web3Connect);
}

export function *watchWeb3Connect() {
  yield takeEvery(actions.WEB3_CONNECT[actions.SUCCESS], web3ContractsDeployed);
}

export function *watchFetchEditorTabs() {
  yield takeEvery(actions.FETCH_EDITOR_TABS[actions.REQUEST], fetchEditorTabs);
}

export function *watchAddEditorTabs() {
  yield takeEvery(actions.ADD_EDITOR_TABS[actions.REQUEST], addEditorTabs);
}

export function *watchRemoveEditorTabs() {
  yield takeEvery(actions.REMOVE_EDITOR_TABS[actions.REQUEST], removeEditorTabs);
}

export function *watchUpdateEditorTabs() {
  yield takeEvery(actions.UPDATE_EDITOR_TABS[actions.REQUEST], updateEditorTabs);
  yield takeEvery(actions.UPDATE_EDITOR_TABS[actions.SUCCESS], fetchEditorTabs);
}

export function *watchAddEditorTabsSuccess() {
  yield takeEvery(actions.ADD_EDITOR_TABS[actions.SUCCESS], fetchEditorTabs);
}

export function *watchRemoveEditorTabsSuccess() {
  yield takeEvery(actions.REMOVE_EDITOR_TABS[actions.SUCCESS], fetchEditorTabs);
}

function createChannel(socket) {
  return eventChannel(emit => {
    socket.onmessage = ((message) => {
      try {
        emit(JSON.parse(message.data));
      } catch(_error) {
        // Ignore the message if not formatted correctly
        // For example message like outputDone (for live reload)
      }
    });
    return () => {
      socket.close();
    };
  });
}

export function *initBlockHeader() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketBlockHeader(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel } = yield race({
      task: take(channel),
      cancel: take(actions.STOP_BLOCK_HEADER)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put({type: actions.ACCOUNTS[actions.REQUEST]});
    yield put({type: actions.BLOCKS[actions.REQUEST]});
    yield put({type: actions.BLOCKS_FULL[actions.REQUEST], txObjects: true, txReceipts: true});
    yield put({type: actions.TRANSACTIONS[actions.REQUEST]});
  }
}

export function *watchInitBlockHeader() {
  yield takeEvery(actions.INIT_BLOCK_HEADER, initBlockHeader);
}

export function *listenToProcessLogs(action) {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketProcess(credentials, action.processName);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, processLog } = yield race({
      processLog: take(channel),
      cancel: take(actions.STOP_NEW_PROCESS_LOGS)
    });

    if (cancel && action.processName === cancel.processName) {
      channel.close();
      return;
    }

    yield put(actions.processLogs.success([processLog]));
  }
}

export function *watchListenToProcessLogs() {
  yield takeEvery(actions.WATCH_NEW_PROCESS_LOGS, listenToProcessLogs);
}

export function *listenServices() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketServices(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, services } = yield race({
      services: take(channel),
      cancel: take(actions.STOP_SERVICES)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put(actions.services.success(services));
  }
}

export function *watchListenServices() {
  yield takeEvery(actions.WATCH_SERVICES, listenServices);
}

export function *listenToContractLogs() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketContractLogs(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractLog = yield take(channel);
    yield put(actions.contractLogs.success([contractLog]));
  }
}

export function *watchListenToContractLogs() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_LOGS, listenToContractLogs);
}

export function *listenToContractEvents() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketContractEvents(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const contractEvent = yield take(channel);
    yield put(actions.contractEvents.success([contractEvent]));
  }
}

export function *watchListenToContractEvents() {
  yield takeEvery(actions.WATCH_NEW_CONTRACT_EVENTS, listenToContractEvents);
}

export function *listenGasOracle() {
  const credentials = yield select(getCredentials);
  const socket = api.websocketGasOracle(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, gasOracleStats } = yield race({
      gasOracleStats: take(channel),
      cancel: take(actions.STOP_GAS_ORACLE)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put(actions.gasOracle.success(gasOracleStats));
  }
}

export function *watchListenGasOracle() {
  yield takeEvery(actions.WATCH_GAS_ORACLE, listenGasOracle);
}

export function *listenDebugger() {
  const credentials = yield select(getCredentials);
  const socket = api.listenToDebugger(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, debuggerInfo } = yield race({
      debuggerInfo: take(channel),
      cancel: take(actions.STOP_DEBUGGER)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put(actions.debuggerInfo.success(debuggerInfo));
  }
}

export function *watchListenDebugger() {
  yield takeEvery(actions.START_DEBUG[actions.SUCCESS], listenDebugger);
}

export function *listenContracts() {
  const credentials = yield select(getCredentials);
  const socket = api.webSocketContracts(credentials);
  const channel = yield call(createChannel, socket);
  while (true) {
    const { cancel, contracts } = yield race({
      contracts: take(channel),
      cancel: take(actions.STOP_CONTRACTS)
    });

    if (cancel) {
      channel.close();
      return;
    }
    yield put(actions.contracts.success(contracts));
  }
}

export function *watchListenContracts() {
  yield takeEvery(actions.WATCH_CONTRACTS, listenContracts);
}

export function *listenToMessages(action) {
  const credentials = yield select(getCredentials);
  const socket = api.listenToChannel(credentials, action.messageChannels[0]);
  const channel = yield call(createChannel, socket);
  while (true) {
    const message = yield take(channel);
    if (message.error) {
      return yield put(actions.messageListen.failure(message.error));
    }
    yield put(actions.messageListen.success([{ channel: action.messageChannels[0], message: message.data, time: message.time }]));
  }
}

export default function *root() {
  yield all([
    fork(watchInitBlockHeader),
    fork(watchFetchAccounts),
    fork(watchFetchAccount),
    fork(watchFetchProcesses),
    fork(watchFetchServices),
    fork(watchFetchProcessLogs),
    fork(watchFetchContractLogs),
    fork(watchFetchContractEvents),
    fork(watchListenToProcessLogs),
    fork(watchListenServices),
    fork(watchListenToContractLogs),
    fork(watchListenToContractEvents),
    fork(watchFetchBlock),
    fork(watchFetchTransactions),
    fork(watchDecodeTransaction),
    fork(watchPostCommand),
    fork(watchPostCommandSuggestions),
    fork(watchFetchVersions),
    fork(watchFetchPlugins),
    fork(watchFetchBlocks),
    fork(watchFetchBlocksFull),
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
    fork(watchPostFolder),
    fork(watchDeleteFile),
    fork(watchDeleteFileSuccess),
    fork(watchFetchFileSuccess),
    fork(watchFetchCredentials),
    fork(watchFetchEthGas),
    fork(watchStartDebug),
    fork(watchStopDebug),
    fork(watchDebugJumpBack),
    fork(watchDebugJumpForward),
    fork(watchDebugStepOverForward),
    fork(watchDebugStepOverBackward),
    fork(watchDebugStepIntoForward),
    fork(watchDebugStepIntoBackward),
    fork(watchToggleBreakpoint),
    fork(watchAuthenticate),
    fork(watchAuthenticateSuccess),
    fork(watchAuthenticateFailure),
    fork(watchLogout),
    fork(watchExplorerSearch),
    fork(watchFetchTheme),
    fork(watchChangeTheme),
    fork(watchListenGasOracle),
    fork(watchSignMessage),
    fork(watchVerifyMessage),
    fork(watchWeb3EstimateGas),
    fork(watchWeb3Deploy),
    fork(watchWeb3IsDeployed),
    fork(watchUpdateDeploymentPipeline),
    fork(watchWeb3Connect),
    fork(watchListenDebugger),
    fork(watchFetchEditorTabs),
    fork(watchAddEditorTabs),
    fork(watchRemoveEditorTabs),
    fork(watchUpdateEditorTabs),
    fork(watchAddEditorTabsSuccess),
    fork(watchRemoveEditorTabsSuccess),
    fork(watchPostFileSuccess),
    fork(watchPostFolderSuccess),
    fork(watchListenContracts)
  ]);
}
