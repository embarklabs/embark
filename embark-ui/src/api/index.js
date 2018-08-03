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

export function fetchProcessLogs(processName) {
  return axios.get(`${constants.httpEndpoint}/process-logs/${processName}`);
}

export function webSocketProcess(processName) {
  return new WebSocket(constants.wsEndpoint + '/process-logs/' + processName);
}

export function webSocketBlockHeader() {
  return new WebSocket(`${constants.wsEndpoint}/blockchain/blockHeader`);
}

export function fetchContract(contractName) {
  return axios.get('http://localhost:8000/embark-api/contract/' + contractName);
}

export function fetchContracts() {
  return axios.get('http://localhost:8000/embark-api/contracts');
}

export function fetchContractProfile(contractName) {
  return axios.get('http://localhost:8000/embark-api/profiler/' + contractName);
}
