import axios from "axios";

const BASE_URL = 'http://localhost:8000/embark-api';

export function fetchAccounts() {
  return axios.get(`${BASE_URL}/blockchain/accounts`);
}

export function fetchBlocks() {
  return axios.get(`${BASE_URL}/blockchain/blocks`);
}

export function fetchProcesses() {
  return axios.get(`${BASE_URL}/processes`);
}
