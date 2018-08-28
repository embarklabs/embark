import {last} from '../utils/utils';

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

export function getTransactionsByAccount(state, address) {
  return state.entities.transactions.filter((transaction) => transaction.from === address);
}

export function getTransactionsByBlock(state, blockNumber) {
  return state.entities.transactions.filter((transaction) => transaction.blockNumber.toString() === blockNumber);
}

export function getBlocks(state) {
  return state.entities.blocks;
}

export function getBlock(state, number) {
  return state.entities.blocks.find((block) => block.number.toString() === number);
}

export function getCommands(state) {
  return state.entities.commands;
}

export function getProcesses(state) {
  return state.entities.processes;
}

export function getProcess(state, name) {
  return state.entities.processes.find((process) => process.name === name);
}

export function getProcessLogsByProcess(state, processName) {
  return state.entities.processLogs.filter((processLog => processLog.name === processName));
}

export function getContractLogsByContract(state, contractName) {
  return state.entities.contractLogs.filter((contractLog => contractLog.name === contractName));
}

export function getContracts(state) {
  return state.entities.contracts.filter(contract => !contract.isFiddle);
}

export function getFiddleContracts(state) {
  return state.entities.contracts.filter(contract => contract.isFiddle);
}

export function getContract(state, contractName) {
  return state.entities.contracts.find((contract => contract.className === contractName));
}

export function getContractProfile(state, contractName) {
  return state.entities.contractProfiles.find((contractProfile => contractProfile.name === contractName));
}

export function getContractFile(state, filename) {
  return state.entities.contractFiles.find((contractFile => contractFile.filename === filename));
}

export function getContractFunctions(state, contractName) {
  return state.entities.contractFunctions.filter((contractFunction => contractFunction.contractName === contractName));
}

export function getContractDeploys(state, contractName) {
  return state.entities.contractDeploys.filter((contractDeploy => contractDeploy.contractName === contractName));
}

export function getVersions(state) {
  return state.entities.versions;
}

export function getGasStats(state) {
  return state.entities.gasStats[state.entities.gasStats.length - 1];
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

export function getFiddle(state) {
  const fiddleCompilation = last(state.entities.fiddles.sort((a, b) => { return (a.timestamp || 0) - (b.timestamp || 0); }));
  const isNoTempFileError = Boolean(fiddleCompilation && fiddleCompilation.codeToCompile && fiddleCompilation.codeToCompile.error && fiddleCompilation.codeToCompile.error.indexOf('ENOENT') > -1);
  return {
    data: fiddleCompilation,
    error: isNoTempFileError ? undefined : state.errorEntities.fiddles
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

export function getEnsErrors(state) {
  return state.errorEntities.ensRecords;
}

export function isEnsEnabled(state) {
  return Boolean(state.entities.plugins.find((plugin) => plugin.name === 'ens'));
}

export function getFiles(state) {
  return state.entities.files;
}
