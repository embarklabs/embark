import axios from "axios";
import constants from '../constants';

const BASE_URL = 'http://localhost:8000/embark-api';

export function fetchAccounts() {
  return axios.get(constants.httpEndpoint + 'blockchain/accounts');
}

export function fetchBlocks(from) {
  return axios.get(`${BASE_URL}/blockchain/blocks`, {params: {from}});
}

export function fetchTransactions(blockFrom) {
  return axios.get(`${BASE_URL}/blockchain/transactions`, {params: {blockFrom}});
}

export function fetchProcesses() {
  return axios.get(constants.httpEndpoint + 'processes');
}
