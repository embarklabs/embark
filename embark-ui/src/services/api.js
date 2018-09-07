import axios from "axios";
import constants from '../constants';

function request(type, path, params = {}, endpoint) {
  axios.defaults.headers.common['Authorization'] = params.token;
  const callback = params.callback || function() {};
  return axios[type]((endpoint || constants.httpEndpoint) + path, params)
    .then((response) => {
      const data = (response.data && response.data.error) ? {error: response.data.error} : {response, error: null};
      callback(data.error, data.response);
      return data;
    }).catch((error) => {
      const data = {response: null, error: error.message || 'Something bad happened'};
      callback(data.error, data.response);
      return data;
    });
}

function get() {
  return request('get', ...arguments);
}

function post() {
  return request('post', ...arguments);
}

function destroy() {
  return request('delete', ...arguments);
}

export function postCommand() {
  return post('/command', ...arguments);
}

export function fetchAccounts() {
  return get('/blockchain/accounts', ...arguments);
}

export function fetchAccount(payload) {
  return get(`/blockchain/accounts/${payload.address}`, ...arguments);
}

export function fetchBlocks(payload) {
  return get('/blockchain/blocks', {params: payload, token: payload.token});
}

export function fetchBlock(payload) {
  return get(`/blockchain/blocks/${payload.blockNumber}`, ...arguments);
}

export function fetchTransactions(payload) {
  return get('/blockchain/transactions', {params: payload, token: payload.token});
}

export function fetchTransaction(payload) {
  return get(`/blockchain/transactions/${payload.hash}`, ...arguments);
}

export function fetchProcesses() {
  return get('/processes', ...arguments);
}

export function fetchProcessLogs(payload) {
  return get(`/process-logs/${payload.processName}`, ...arguments);
}

export function fetchContractLogs() {
  return get(`/contracts/logs`, ...arguments);
}

export function fetchContracts() {
  return get('/contracts', ...arguments);
}

export function fetchContract(payload) {
  return get(`/contract/${payload.contractName}`, ...arguments);
}

export function postContractFunction(payload) {
  return post(`/contract/${payload.contractName}/function`, ...arguments);
}

export function postContractDeploy(payload) {
  return post(`/contract/${payload.contractName}/deploy`, ...arguments);
}

export function postContractCompile() {
  return post('/contract/compile', ...arguments);
}

export function fetchVersions() {
  return get('/versions', ...arguments);
}

export function fetchPlugins() {
  return get('/plugins', ...arguments);
}

export function sendMessage(payload) {
  return post(`/communication/sendMessage`, Object.assign({}, payload.body, {token: payload.token}));
}

export function fetchContractProfile(payload) {
  return get(`/profiler/${payload.contractName}`, ...arguments);
}

export function fetchEnsRecord(payload) {
  const _payload = {params: payload, token: payload.token};
  if (payload.name) {
    return get('/ens/resolve', _payload);
  } else {
    return get('/ens/lookup', _payload);
  }
}

export function postEnsRecord() {
  return post('/ens/register', ...arguments);
}

export function getEthGasAPI() {
  return get('/blockchain/gas/oracle', ...arguments);
}

export function fetchFiles() {
  return get('/files', ...arguments);
}

export function fetchFile(payload) {
  return get('/file', {params: payload, token: payload.token});
}

export function postFile() {
  return post('/files', ...arguments);
}

export function deleteFile(payload) {
  return destroy('/file', {params: payload, token: payload.token});
}

export function authorize() {
  return post('/authorize', ...arguments);
}

// TODO token for WS?
export function listenToChannel(channel) {
  return new WebSocket(`${constants.wsEndpoint}/communication/listenTo/${channel}`);
}

export function webSocketProcess(processName) {
  return new WebSocket(constants.wsEndpoint + '/process-logs/' + processName);
}

export function webSocketContractLogs() {
  return new WebSocket(constants.wsEndpoint + '/contracts/logs');
}

export function webSocketBlockHeader() {
  return new WebSocket(`${constants.wsEndpoint}/blockchain/blockHeader`);
}

export function websocketGasOracle() {
  return new WebSocket(`${constants.wsEndpoint}/blockchain/gas/oracle`);
}
