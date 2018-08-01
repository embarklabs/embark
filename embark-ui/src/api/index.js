import axios from "axios";

export function fetchAccounts() {
  return axios.get('http://localhost:8000/embark-api/blockchain/accounts');
}

export function fetchProcesses() {
  return axios.get('http://localhost:8000/embark-api/processes');
}
