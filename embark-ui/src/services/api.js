import axios from "axios";

function request(type, path, params = {}) {
  axios.defaults.headers.common['Authorization'] = params.credentials.token;
  const endpoint = `http://${params.credentials.host}/embark-api${path}`;
  return axios[type](endpoint, params)
    .then((response) => {
      return (response.data && response.data.error) ? {error: response.data.error} : {response, error: null};
    }).catch((error) => {
      return {response: null, error: error.message || 'Something bad happened'};
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
  return get('/blockchain/blocks', {params: payload, credentials: payload.credentials});
}

export function fetchBlock(payload) {
  return get(`/blockchain/blocks/${payload.blockNumber}`, ...arguments);
}

export function fetchTransactions(payload) {
  return get('/blockchain/transactions', {params: payload, credentials: payload.credentials});
}

export function fetchTransaction(payload) {
  return get(`/blockchain/transactions/${payload.hash}`, ...arguments);
}

export function fetchProcesses() {
  return get('/processes', ...arguments);
}

export function fetchProcessLogs(payload) {
  return get(`/process-logs/${payload.processName}`, {params: payload, processName: payload.processName, credentials: payload.credentials});
}

export function fetchContractLogs() {
  return get(`/contracts/logs`, ...arguments);
}

export function fetchContracts() {
  return get('/contracts', ...arguments);
}

export function fetchContract(payload) {
  return get('/contract', ...arguments);
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
  return post(`/communication/sendMessage`, Object.assign({}, payload.body, {credentials: payload.credentials}));
}

export function fetchContractProfile(payload) {
  return get(`/profiler/${payload.contractName}`, ...arguments);
}

export function fetchEnsRecord(payload) {
  const _payload = {params: payload, credentials: payload.credentials};
  if (payload.name) {
    return get('/ens/resolve', _payload);
  }

  return get('/ens/lookup', _payload);
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
  return get('/file', {params: payload, credentials: payload.credentials});
}

export function postFile() {
  return post('/files', ...arguments);
}

export function deleteFile(payload) {
  return destroy('/file', {params: payload, credentials: payload.credentials});
}

export function authenticate(payload) {
  return post('/authenticate', {...payload, credentials: payload});
}

export function listenToChannel(credentials, channel) {
  return new WebSocket(`ws://${credentials.host}/embark-api/communication/listenTo/${channel}`, [credentials.token]);
}

export function webSocketProcess(credentials, processName) {
  return new WebSocket(`ws://${credentials.host}/embark-api/process-logs/${processName}`, [credentials.token]);
}

export function webSocketContractLogs(credentials) {
  return new WebSocket(`ws://${credentials.host}/embark-api/contracts/logs`, [credentials.token]);
}

export function webSocketBlockHeader(credentials) {
  return new WebSocket(`ws://${credentials.host}/embark-api/blockchain/blockHeader`, [credentials.token]);
}

export function websocketGasOracle(credentials) {
  return new WebSocket(`ws://${credentials.host}/embark-api/blockchain/gas/oracle`, [credentials.token]);
}
