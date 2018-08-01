import axios from "axios";

export function fetchAccounts() {
  return axios.get('http://localhost:8000/embark-api/blockchain/accounts');
};
