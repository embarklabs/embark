import axios from "axios";
import constants from '../constants';

export function fetchAccounts() {
  return axios.get(`${constants.httpEndpoint}/blockchain/accounts`);
}

export function fetchAccount(address) {
  return axios.get(`${constants.httpEndpoint}/blockchain/accounts/${address}`);
}

export function fetchBlocks(from) {
  return axios.get(`${constants.httpEndpoint}/blockchain/blocks`, {params: {from}});
}

export function fetchBlock(blockNumber) {
  return axios.get(`${constants.httpEndpoint}/blockchain/blocks/${blockNumber}`);
}

export function fetchTransactions(blockFrom) {
  return axios.get(`${constants.httpEndpoint}/blockchain/transactions`, {params: {blockFrom}});
}

export function fetchTransaction(hash) {
  return axios.get(`${constants.httpEndpoint}/blockchain/transactions/${hash}`);
}

export function fetchProcesses() {
  return axios.get(`${constants.httpEndpoint}/processes`);
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
