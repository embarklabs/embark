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
  return state.entities.contractLogs;
  // return state.entities.processLogs.filter((processLog => processLog.name === processName));
}

export function getContracts(state) {
  return state.entities.contracts;
}

export function getContract(state, contractName) {
  return state.entities.contracts.find((contract => contract.className === contractName));
}

export function getContractProfile(state, contractName) {
  return state.entities.contractProfiles.find((contractProfile => contractProfile.name === contractName));
}

export function getMessageVersion(state) {
  return state.entities.messageVersion;
}

export function getMessageChannels(state) {
  return state.entities.messageChannels;
}

export function getMessages(state) {
  const messages = {};
  state.entities.messages.forEach(message => {
    if (!messages[message.channel]) {
      messages[message.channel] = []
    }
    messages[message.channel].push(message);
  });
  return messages;
}
