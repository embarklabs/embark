import axios from "axios";
import keccak from "keccakjs";

function hash(cnonce, token, type, path, params = {}) {
  let hash = new keccak();
  hash.update(cnonce.toString());
  hash.update(token);
  hash.update(type.toUpperCase());
  hash.update(`/embark-api${path}`);
  return hash.digest('hex');
}

function request(type, path, params = {}) {
  const cnonce = Date.now() + Math.random();

  // Extract credentials out of the params and delete so the token doesn't get sent
  // as cleartext.
  let credentials = params.credentials;
  delete params.credentials;

  let requestHash = hash(cnonce, credentials.token, type, path, params);

  const endpoint = `http://${credentials.host}/embark-api${path}`;
  const req = {
    method: type,
    url: endpoint,
    headers: {
      'X-Embark-Request-Hash': requestHash,
      'X-Embark-Cnonce': cnonce
    },
    ...(type === 'post' ? { data: params } : {}),
    ...(['get', 'delete'].includes(type) ? { params: params.params } : {})
  }

  return axios(req)
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

function websocket(credentials, path) {
  const cnonce = Date.now() + Math.random();
  const requestHash = hash(cnonce, credentials.token, 'ws', '/', {});

  return new WebSocket(`ws://${credentials.host}/embark-api${path}`, [`${cnonce}|${requestHash}`]);
}

export function postCommand() {
  return post('/command', ...arguments);
}

export function postCommandSuggestions() {
  return post('/suggestions', ...arguments);
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

export function fetchServices() {
  return get('/services', ...arguments);
}

export function fetchProcessLogs(payload) {
  return get(`/process-logs/${payload.processName}`, {params: payload, credentials: payload.credentials});
}

export function fetchContractLogs() {
  return get(`/contracts/logs`, ...arguments);
}

export function fetchContractEvents() {
  return get(`/blockchain/contracts/events`, ...arguments);
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

export function postFolder() {
  return post('/folders', ...arguments);
}

export function deleteFile(payload) {
  return destroy('/file', {params: payload, credentials: payload.credentials});
}

export function authenticate(payload) {
  return post('/authenticate', {...payload, credentials: payload});
}

export function signMessage(payload) {
  return post('/messages/sign', ...arguments);
}

export function verifyMessage(payload) {
  return post('/messages/verify', ...arguments);
}

export function startDebug(payload) {
  return post('/debugger/start', {params: payload, credentials: payload.credentials});
}

export function debugJumpBack(payload) {
  return post('/debugger/jumpBack', {params: payload, credentials: payload.credentials});
}

export function debugJumpForward(payload) {
  return post('/debugger/jumpForward', {params: payload, credentials: payload.credentials});
}

export function debugStepOverForward(payload) {
  return post('/debugger/stepOverForward', {params: payload, credentials: payload.credentials});
}

export function debugStepOverBackward(payload) {
  return post('/debugger/stepOverBackward', {params: payload, credentials: payload.credentials});
}

export function debugStepIntoForward(payload) {
  return post('/debugger/stepIntoForward', {params: payload, credentials: payload.credentials});
}

export function debugStepIntoBackward(payload) {
  return post('/debugger/stepIntoBackward', {params: payload, credentials: payload.credentials});
}

export function toggleBreakpoint(payload) {
  return post('/debugger/breakpoint', {params: payload, credentials: payload.credentials});
}

export function initRegularTxs(payload) {
  return get('/regular-txs', {params: payload, credentials: payload.credentials});
}

export function listenToDebugger(credentials) {
  return websocket(credentials, '/debugger');
}

export function listenToChannel(credentials, channel) {
  return websocket(credentials, `/communication/listenTo/${channel}`);
}

export function webSocketProcess(credentials, processName) {
  return websocket(credentials, `/process-logs/${processName}`);
}

export function webSocketServices(credentials) {
  return websocket(credentials, `/services`);
}

export function webSocketContractLogs(credentials) {
  return websocket(credentials, `/contracts/logs`);
}

export function webSocketContracts(credentials) {
  return websocket(credentials, `/contracts`);
}

export function webSocketContractEvents(credentials) {
  return websocket(credentials, `/blockchain/contracts/event`);
}

export function webSocketBlockHeader(credentials) {
  return websocket(credentials, `/blockchain/blockHeader`);
}

export function websocketGasOracle(credentials) {
  return websocket(credentials, `/blockchain/gas/oracle`);
}
