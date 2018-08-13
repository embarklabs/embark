import axios from "axios";
import constants from '../constants';

function get(path, params) {
  return axios.get(constants.httpEndpoint + path, params)
    .then((response) => {
      return {response};
    }).catch((error) => {
      return {response: null, error: error.message || 'Something bad happened'};
    });
}

function post(path, params) {
  return axios.post(constants.httpEndpoint + path, params)
    .then((response) => {
      return {response};
    })
    .catch((error) => {
      return {response: null, error: error.message || 'Something bad happened'};
    });
}

export function postCommand(payload) {
  return post('/command', payload);
}

export function fetchAccounts() {
  return get('/blockchain/accounts');
}

export function fetchAccount(payload) {
  return get(`/blockchain/accounts/${payload.address}`);
}

export function fetchBlocks(payload) {
  return get('/blockchain/blocks', {params: payload});
}

export function fetchBlock(payload) {
  return get(`/blockchain/blocks/${payload.blockNumber}`);
}

export function fetchTransactions(payload) {
  return get('/blockchain/transactions', {params: payload});
}

export function fetchTransaction(payload) {
  return get(`/blockchain/transactions/${payload.hash}`);
}

export function fetchProcesses() {
  return get('/processes');
}

export function fetchProcessLogs(payload) {
  return get(`/process-logs/${payload.processName}`);
}

export function fetchContractLogs() {
  return get(`/contracts/logs`);
}

export function fetchContracts() {
  return get('/contracts');
}

export function fetchContract(payload) {
  return get(`/contract/${payload.contractName}`);
}

export function fetchVersions() {
  return get('/versions');
}

export function fetchPlugins() {
  return get('/plugins');
}

export function sendMessage(payload) {
  return post(`/communication/sendMessage`, payload.body);
}

export function fetchContractProfile(payload) {
  return get(`/profiler/${payload.contractName}`);
}

export function fetchENSRecord(payload) {
  if (payload.name) {
    return get('/ens/resolve', {params: payload});
  } else {
    return get('/ens/lookup', {params: payload});
  }
}

export function postENSRecord(payload) {
  return post('/ens/register', payload);
}

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

export function fetchFiddle(payload) {
  return post('/contract/compile', {code: payload.codeToCompile});
}
