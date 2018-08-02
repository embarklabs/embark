import axios from "axios";

const BASE_URL = 'http://localhost:8000/embark-api';

export function fetchAccounts() {
  return axios.get(`${BASE_URL}/blockchain/accounts`);
}

export function fetchBlocks(from) {
  return axios.get(`${BASE_URL}/blockchain/blocks`, {params: {from}});
}

export function fetchTransactions(blockFrom) {
  return axios.get(`${BASE_URL}/blockchain/transactions`, {params: {blockFrom}});
}

export function fetchProcesses() {
  return axios.get(`${BASE_URL}/processes`);
}
