import {last} from '../utils/utils';

export function getCredentials(state) {
  return state.credentials;
}

export function getAuthenticationError(state) {
  return state.credentials.error;
}

export function getTheme(state) {
  return state.theme;
}

export function getAccounts(state) {
  return state.entities.accounts;
}

export function getAccount(state, address) {
  return state.entities.accounts.find((account) => account.address === address);
}

export function getTransactions(state) {
  return state.entities.transactions;
}

export function getTransaction(state, hash) {
  return state.entities.transactions.find((transaction) => transaction.hash === hash);
}

export function getDecodedTransaction(state) {
  return state.decodedTransaction;
}

export function getTransactionsByAccount(state, address) {
  return state.entities.transactions.filter((transaction) => transaction.from === address);
}

export function getTransactionsByBlock(state, blockNumber) {
  return state.entities.transactions.filter((transaction) => transaction.hasOwnProperty('blockNumber') && transaction.blockNumber.toString() === blockNumber);
}

export function getBlocks(state) {
  return state.entities.blocks;
}

export function getBlocksFull(state) {
  return state.entities.blocksFull;
}

export function getLastBlock(state) {
  return state.entities.blocks[0];
}

export function getBlock(state, number) {
  return state.entities.blocks.find((block) => block.number.toString() === number);
}

export function getProcesses(state) {
  return state.entities.processes;
}

export function getServices(state) {
  return state.entities.services;
}

export function getProcessLogs(state) {
  return state.entities.processLogs;
}

export function getCommandSuggestions(state) {
  return state.entities.commandSuggestions;
}

export function getContractLogsByContract(state, contractName) {
  return state.entities.contractLogs.filter((contractLog => contractLog.name === contractName));
}

export function getContractEventsByContract(state, contractName) {
  return state.entities.contractEvents.filter((contractEvent => contractEvent.name === contractName));
}

export function getContracts(state) {
  return state.entities.contracts
}

export function getContract(state, contractName) {
  return state.entities.contracts.find((contract => contract.className === contractName));
}

export function getContractsByPath(state, path) {
  return state.entities.contracts.filter((contract => contract.path === path));
}

export function getContractProfile(state, contractName) {
  return state.entities.contractProfiles.find((contractProfile => contractProfile.name === contractName));
}

export function getContractFunctions(state, contractName) {
  return state.entities.contractFunctions.filter((contractFunction => contractFunction.contractName === contractName));
}

export function getContractDeploys(state, contractName) {
  return state.entities.contractDeploys.filter((contractDeploy => contractDeploy.contractName === contractName));
}

export function getContractCompile(state, file) {
  let contractCompile = state.entities.contractCompiles.reverse().find((contractCompile => contractCompile.name === file.name));
  if (!contractCompile) return;
  if (contractCompile.errors) {
    contractCompile.warnings = contractCompile.errors.filter((error) => error.severity === 'warning');
    contractCompile.errors = contractCompile.errors.filter((error) => error.severity === 'error');
  }

  return contractCompile;
}

export function getVersions(state) {
  return state.entities.versions;
}

export function getOracleGasStats(state) {
  if (!state.entities.gasOracleStats.length) {
    return {};
  }
  return state.entities.gasOracleStats[0];
}

export function isWeb3Enabled(state) {
  return Boolean(state.entities.versions.find((version) => version.name === 'web3'));
}

export function isOldWeb3(state) {
  const web3 = state.entities.versions.find((version) => version.name === 'web3');
  return web3 && parseInt(web3[0], 10) === 0;
}

export function getMessageChannels(state) {
  return state.entities.messageChannels;
}

export function getMessages(state) {
  const messages = {};
  state.entities.messages.forEach(message => {
    if (!messages[message.channel]) {
      messages[message.channel] = [];
    }
    messages[message.channel].push(message);
  });
  return messages;
}

export function getMessagesError(state) {
  return {
    error: state.errorEntities.messages
  };
}

export function getFiddleDeploy(state) {
  return {
    data: last(state.entities.fiddleDeploys),
    error: state.errorEntities.fiddleDeploys
  };
}

export function getEnsRecords(state) {
  return state.entities.ensRecords;
}

export function getEnsRecordForName(state, name) {
  return state.entities.ensRecords.find((record) => record.name === name);
}

export function getEnsErrors(state) {
  return state.errorEntities.ensRecords;
}

export function isEnsEnabled(state) {
  return Boolean(state.errorEntities.ensRecords !== "Request failed with status code 404");
}

export function getFiles(state) {
  return state.entities.files;
}

export function getRootDirname(state) {
  return state.entities.files[0] && state.entities.files[0].dirname;
}

export function getCurrentFile(state) {
  return state.editorTabs.find(file => file.active) || {};
}

export function getBaseEther(state) {
  return state.baseEther;
}

export function searchResult(state) {
  return state.searchResult;
}

export function getMessageSignaturePendingState(state) {
  return state.messageSignature.pending;
}

export function getMessageSignaturePayload(state) {
  return state.messageSignature.payload ? JSON.stringify(state.messageSignature.payload, null, 2): null;
}

export function getMessageSignatureError(state) {
  return state.messageSignature.error;
}

export function getVerificationPendingState(state) {
  return state.messageVerification.pending;
}

export function getVerifiedAddressPayload(state) {
  return state.messageVerification.payload ? state.messageVerification.payload.verifiedAddress : null;
}

export function getVerificationError(state) {
  return state.messageVerification.error;
}

export function getBreakpointsByFilename(state, filename) {
  return state.breakpoints[filename] || [];
}

export function getDeploymentPipeline(state) {
  return state.deploymentPipeline;
}

export function getWeb3(state) {
  return state.web3.instance;
}

export function getWeb3GasEstimates(state) {
  return state.web3.gasEstimates;
}

export function getWeb3Deployments(state) {
  return state.web3.deployments;
}

export function getWeb3ContractsDeployed(state) {
  return state.web3.contractsDeployed;
}

export function getDebuggerInfo(state) {
  return state.debuggerInfo;
}

export function getDebuggerLine(state) {
  if (!state.debuggerInfo.sources || !state.debuggerInfo.sources.lineColumnPos[0]) return;
  return state.debuggerInfo.sources.lineColumnPos[0].start.line + 1;
}

export function getEditorTabs(state) {
  return state.editorTabs;
}

export function getPreviewUrl(state) {
  return state.previewUrl;
}

export function getEditorOperationStatus(state) {
  return state.editorOperationStatus;
}

export function isLoading(state) {
  return state.loading;
}
