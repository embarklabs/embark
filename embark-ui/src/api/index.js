import axios from "axios";
import constants from '../constants';

export function fetchAccounts() {
  return axios.get(`${constants.httpEndpoint}/blockchain/accounts`);
}

export function fetchBlocks(from) {
  return axios.get(`${constants.httpEndpoint}/blockchain/blocks`, {params: {from}});
}

export function fetchTransactions(blockFrom) {
  return axios.get(`${constants.httpEndpoint}/blockchain/transactions`, {params: {blockFrom}});
}

export function fetchProcesses() {
  return axios.get(`${constants.httpEndpoint}/processes`);
}

export function fetchProcessLogs(processName) {
  return axios.get(`${constants.httpEndpoint}/process-logs/${processName}`);
}

export function webSocketBlockHeader() {
  return new WebSocket(`${constants.wsEndpoint}/blockchain/blockHeader`);
}
