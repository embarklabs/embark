import EmbarkAPI from 'embark-api-client';

const embarkAPI = new EmbarkAPI();

export function postCommand() {
  return embarkAPI.postCommand(...arguments)
}

export function postCommandSuggestions() {
  return embarkAPI.postCommandSuggestions(...arguments);
}

export function fetchAccounts() {
  return embarkAPI.fetchAccounts(...arguments);
}

export function fetchAccount(payload) {
  return embarkAPI.fetchAccount(payload, ...arguments);
}

export function fetchBlocks(payload) {
  return embarkAPI.fetchBlocks(payload);
}

export function fetchBlock(payload) {
  return embarkAPI.fetchBlock(payload, ...arguments);
}

export function fetchTransactions(payload) {
  return embarkAPI.fetchTransactions(payload);
}

export function fetchTransaction(payload) {
  return embarkAPI.fetchTransaction(payload, ...arguments);
}

export function fetchProcesses() {
  return embarkAPI.fetchProcesses(...arguments);
}

export function fetchServices() {
  return embarkAPI.fetchServices(...arguments);
}

export function fetchProcessLogs(payload) {
  return embarkAPI.fetchProcessLogs(payload);
}

export function fetchContractLogs() {
  return embarkAPI.fetchContractLogs(...arguments);
}

export function fetchContractEvents() {
  return embarkAPI.fetchContractEvents(...arguments);
}

export function fetchContracts() {
  return embarkAPI.fetchContracts(...arguments);
}

export function fetchContract(payload) {
  return embarkAPI.fetchContract(payload, ...arguments);
}

export function postContractFunction(payload) {
  return embarkAPI.postContractFunction(payload, ...arguments);
}

export function postContractDeploy(payload) {
  return embarkAPI.postContractDeploy(payload, ...arguments);
}

export function postContractCompile() {
  return embarkAPI.postContractCompile(...arguments);
}

export function fetchVersions() {
  return embarkAPI.fetchVersions(...arguments);
}

export function fetchPlugins() {
  return embarkAPI.fetchPlugins(...arguments);
}

export function sendMessage(payload) {
  return embarkAPI.sendMessage(payload);
}

export function fetchContractProfile(payload) {
  return embarkAPI.fetchContractProfile(payload, ...arguments);
}

export function fetchEnsRecord(payload) {
  return embarkAPI.fetchEnsRecord(payload);
}

export function postEnsRecord() {
  return embarkAPI.postEnsRecord(...arguments);
}

export function getEthGasAPI() {
  return embarkAPI.getEthGasAPI(...arguments);
}

export function fetchFiles() {
  return embarkAPI.fetchFiles(...arguments);
}

export function fetchFile(payload) {
  return embarkAPI.fetchFile(payload);
}

export function postFile() {
  return embarkAPI.postFile(...arguments);
}

export function postFolder() {
  return embarkAPI.postFolder(...arguments);
}

export function deleteFile(payload) {
  return embarkAPI.deleteFile(payload);
}

export function authenticate(payload) {
  return embarkAPI.authenticate(payload);
}

export function signMessage(payload) {
  return embarkAPI.signMessage(payload, ...arguments);
}

export function verifyMessage(payload) {
  return embarkAPI.verifyMessage(payload, ...arguments);
}

export function startDebug(payload) {
  return embarkAPI.startDebug(payload);
}

export function stopDebug(payload) {
  return embarkAPI.stopDebug(payload);
}

export function debugJumpBack(payload) {
  return embarkAPI.debugJumpBack(payload);
}

export function debugJumpForward(payload) {
  return embarkAPI.debugJumpForward(payload);
}

export function debugStepOverForward(payload) {
  return embarkAPI.debugStepOverForward(payload);
}

export function debugStepOverBackward(payload) {
  return embarkAPI.debugStepOverBackward(payload);
}

export function debugStepIntoForward(payload) {
  return embarkAPI.debugStepIntoForward(payload);
}

export function debugStepIntoBackward(payload) {
  return embarkAPI.debugStepIntoBackward(payload);
}

export function toggleBreakpoint(payload) {
  return embarkAPI.toggleBreakpoint(payload);
}

export function listenToDebugger(credentials) {
  return embarkAPI.listenToDebugger(credentials);
}

export function listenToChannel(credentials, channel) {
  return embarkAPI.listenToChannel(credentials, channel);
}

export function webSocketProcess(credentials, processName) {
  return embarkAPI.webSocketProcess(credentials, processName);
}

export function webSocketServices(credentials) {
  return embarkAPI.webSocketServices(credentials);
}

export function webSocketContractLogs(credentials) {
  return embarkAPI.webSocketContractLogs(credentials);
}

export function webSocketContracts(credentials) {
  return embarkAPI.webSocketContracts(credentials);
}

export function webSocketContractEvents(credentials) {
  return embarkAPI.webSocketContractEvents(credentials);
}

export function webSocketBlockHeader(credentials) {
  return embarkAPI.webSocketBlockHeader(credentials);
}

export function websocketGasOracle(credentials) {
  return embarkAPI.websocketGasOracle(credentials);
}
