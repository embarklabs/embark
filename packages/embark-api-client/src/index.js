import axios from "axios";
import keccak from "keccakjs";

function hash(cnonce, token, type, path) {
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
  };

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

class EmbarkAPI {

  postCommand() {
    return post('/command', ...arguments);
  }

  postCommandSuggestions() {
    return post('/suggestions', ...arguments);
  }

  fetchAccounts() {
    return get('/blockchain/accounts', ...arguments);
  }

  fetchAccount(payload) {
    return get(`/blockchain/accounts/${payload.address}`, ...arguments);
  }

  fetchBlocks(payload) {
    return get('/blockchain/blocks', {params: payload, credentials: payload.credentials});
  }

  fetchBlock(payload) {
    return get(`/blockchain/blocks/${payload.blockNumber}`, ...arguments);
  }

  fetchTransactions(payload) {
    return get('/blockchain/transactions', {params: payload, credentials: payload.credentials});
  }

  fetchTransaction(payload) {
    return get(`/blockchain/transactions/${payload.hash}`, ...arguments);
  }

  fetchProcesses() {
    return get('/processes', ...arguments);
  }

  fetchServices() {
    return get('/services', ...arguments);
  }

  fetchProcessLogs(payload) {
    return get(`/process-logs/${payload.processName}`, {params: payload, credentials: payload.credentials});
  }

  fetchContractLogs() {
    return get(`/contracts/logs`, ...arguments);
  }

  fetchContractEvents() {
    return get(`/blockchain/contracts/events`, ...arguments);
  }

  fetchContracts() {
    return get('/contracts', ...arguments);
  }

  fetchContract(payload) {
    return get(`/contract/${payload.contractName}`, ...arguments);
  }

  postContractFunction(payload) {
    return post(`/contract/${payload.contractName}/function`, ...arguments);
  }

  postContractDeploy(payload) {
    return post(`/contract/${payload.contractName}/deploy`, ...arguments);
  }

  postContractCompile() {
    return post('/contract/compile', ...arguments);
  }

  fetchVersions() {
    return get('/versions', ...arguments);
  }

  fetchPlugins() {
    return get('/plugins', ...arguments);
  }

  sendMessage(payload) {
    return post(`/communication/sendMessage`, Object.assign({}, payload.body, {credentials: payload.credentials}));
  }

  fetchContractProfile(payload) {
    return get(`/profiler/${payload.contractName}`, ...arguments);
  }

  fetchEnsRecord(payload) {
    const _payload = {params: payload, credentials: payload.credentials};
    if (payload.name) {
      return get('/ens/resolve', _payload);
    }

    return get('/ens/lookup', _payload);
  }

  postEnsRecord() {
    return post('/ens/register', ...arguments);
  }

  getEthGasAPI() {
    return get('/blockchain/gas/oracle', ...arguments);
  }

  fetchFiles() {
    return get('/files', ...arguments);
  }

  fetchFile(payload) {
    return get('/file', {params: payload, credentials: payload.credentials});
  }

  postFile() {
    return post('/files', ...arguments);
  }

  postFolder() {
    return post('/folders', ...arguments);
  }

  deleteFile(payload) {
    return destroy('/file', {params: payload, credentials: payload.credentials});
  }

  authenticate(payload) {
    return post('/authenticate', {...payload, credentials: payload});
  }

  signMessage() {
    return post('/messages/sign', ...arguments);
  }

  verifyMessage() {
    return post('/messages/verify', ...arguments);
  }

  startDebug(payload) {
    return post('/debugger/start', {params: payload, credentials: payload.credentials});
  }

  stopDebug(payload) {
    return post('/debugger/stop', {params: payload, credentials: payload.credentials});
  }

  debugJumpBack(payload) {
    return post('/debugger/jumpBack', {params: payload, credentials: payload.credentials});
  }

  debugJumpForward(payload) {
    return post('/debugger/jumpForward', {params: payload, credentials: payload.credentials});
  }

  debugStepOverForward(payload) {
    return post('/debugger/stepOverForward', {params: payload, credentials: payload.credentials});
  }

  debugStepOverBackward(payload) {
    return post('/debugger/stepOverBackward', {params: payload, credentials: payload.credentials});
  }

  debugStepIntoForward(payload) {
    return post('/debugger/stepIntoForward', {params: payload, credentials: payload.credentials});
  }

  debugStepIntoBackward(payload) {
    return post('/debugger/stepIntoBackward', {params: payload, credentials: payload.credentials});
  }

  toggleBreakpoint(payload) {
    return post('/debugger/breakpoint', {params: payload, credentials: payload.credentials});
  }

  listenToDebugger(credentials) {
    return websocket(credentials, '/debugger');
  }

  listenToChannel(credentials, channel) {
    return websocket(credentials, `/communication/listenTo/${channel}`);
  }

  webSocketProcess(credentials, processName) {
    return websocket(credentials, `/process-logs/${processName}`);
  }

  webSocketServices(credentials) {
    return websocket(credentials, `/services`);
  }

  webSocketContractLogs(credentials) {
    return websocket(credentials, `/contracts/logs`);
  }

  webSocketContracts(credentials) {
    return websocket(credentials, `/contracts`);
  }

  webSocketContractEvents(credentials) {
    return websocket(credentials, `/blockchain/contracts/event`);
  }

  webSocketBlockHeader(credentials) {
    return websocket(credentials, `/blockchain/blockHeader`);
  }

  websocketGasOracle(credentials) {
    return websocket(credentials, `/blockchain/gas/oracle`);
  }

}

export default EmbarkAPI;
