import axios from "axios";

export function fetchAccounts() {
  return axios.get('http://localhost:8000/embark-api/blockchain/accounts');
}

export function fetchProcesses() {
  console.log('Calling this shit');
  const stuff = axios.get('http://localhost:8000/embark-api/processes');
  stuff.then(result => {
    console.log('result', result);
  }).catch(console.error);
  return stuff;
}
