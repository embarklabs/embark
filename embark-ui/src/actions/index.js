export const REQUEST = 'REQUEST';
export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';

function createRequestTypes(base) {
  return [REQUEST, SUCCESS, FAILURE].reduce((acc, type) => {
    acc[type] = `${base}_${type}`;
    return acc;
  }, {});
}

function action(type, payload = {}) {
  return {type, ...payload};
}

export const ACCOUNTS = createRequestTypes('ACCOUNTS');
export const accounts = {
  request: () => action(ACCOUNTS[REQUEST]),
  success: (accounts) => action(ACCOUNTS[SUCCESS], {accounts}),
  failure: (error) => action(ACCOUNTS[FAILURE], {error})
};

export const ACCOUNT = createRequestTypes('ACCOUNT');
export const account = {
  request: (address) => action(ACCOUNT[REQUEST], {address}),
  success: (account) => action(ACCOUNT[SUCCESS], {accounts: [account]}),
  failure: (error) => action(ACCOUNT[FAILURE], {error})
};

export const BLOCKS = createRequestTypes('BLOCKS');
export const blocks = {
  request: (from) => action(BLOCKS[REQUEST], {from}),
  success: (blocks) => action(BLOCKS[SUCCESS], {blocks}),
  failure: (error) => action(BLOCKS[FAILURE], {error})
};

export const BLOCK = createRequestTypes('BLOCK');
export const block = {
  request: (blockNumber) => action(BLOCK[REQUEST], {blockNumber}),
  success: (block) => action(BLOCK[SUCCESS], {blocks: [block]}),
  failure: (error) => action(BLOCK[FAILURE], {error})
};

export const TRANSACTIONS = createRequestTypes('TRANSACTIONS');
export const transactions = {
  request: (blockFrom) => action(TRANSACTIONS[REQUEST], {blockFrom}),
  success: (transactions) => action(TRANSACTIONS[SUCCESS], {transactions}),
  failure: (error) => action(TRANSACTIONS[FAILURE], {error})
};

export const TRANSACTION = createRequestTypes('TRANSACTION');
export const transaction = {
  request: (hash) => action(TRANSACTION[REQUEST], {hash}),
  success: (transaction) => action(TRANSACTION[SUCCESS], {transactions: [transaction]}),
  failure: (error) => action(TRANSACTION[FAILURE], {error})
};

export const PROCESSES = createRequestTypes('PROCESSES');
export const processes = {
  request: () => action(PROCESSES[REQUEST]),
  success: (processes) => action(PROCESSES[SUCCESS], {processes}),
  failure: (error) => action(PROCESSES[FAILURE], {error})
};

export const COMMANDS = createRequestTypes('COMMANDS');
export const commands = {
  post: (command) => action(COMMANDS[REQUEST], {command}),
  success: (command) => action(COMMANDS[SUCCESS], {commands: [command]}),
  failure: (error) => action(COMMANDS[FAILURE], {error})
};

export const PROCESS_LOGS = createRequestTypes('PROCESS_LOGS');
export const processLogs = {
  request: (processName) => action(PROCESS_LOGS[REQUEST], {processName}),
  success: (processLogs) => action(PROCESS_LOGS[SUCCESS], {processLogs}),
  failure: (error) => action(PROCESS_LOGS[FAILURE], {error})
};

export const CONTRACTS = createRequestTypes('CONTRACTS');
export const contracts = {
  request: () => action(CONTRACTS[REQUEST]),
  success: (contracts) => action(CONTRACTS[SUCCESS], {contracts}),
  failure: (error) => action(CONTRACTS[FAILURE], {error})
};

export const CONTRACT = createRequestTypes('CONTRACT');
export const contract = {
  request: (contractName) => action(CONTRACT[REQUEST], {contractName}),
  success: (contract) => action(CONTRACT[SUCCESS], {contracts: [contract]}),
  failure: (error) => action(CONTRACT[FAILURE], {error})
};

export const CONTRACT_PROFILE = createRequestTypes('CONTRACT_PROFILE');
export const contractProfile = {
  request: (contractName) => action(CONTRACT_PROFILE[REQUEST], {contractName}),
  success: (contractProfile) => action(CONTRACT_PROFILE[SUCCESS], {contractProfiles: [contractProfile]}),
  failure: (error) => action(CONTRACT_PROFILE[FAILURE], {error})
};

export const MESSAGE_VERSION = createRequestTypes('MESSAGE_VERSION');
export const messageVersion = {
  request: () => action(MESSAGE_VERSION[REQUEST]),
  success: (messageVersion) => action(MESSAGE_VERSION[SUCCESS], {messageVersion}),
  failure: (error) => action(MESSAGE_VERSION[FAILURE], {error})
};

export const MESSAGE_SEND = createRequestTypes('MESSAGE_SEND');
export const messageSend = {
  request: (body) => action(MESSAGE_SEND[REQUEST], {body}),
  success: () => action(MESSAGE_SEND[SUCCESS]),
  failure: (error) => action(MESSAGE_SEND[FAILURE], {error})
};

export const MESSAGE_LISTEN = createRequestTypes('MESSAGE_LISTEN');
export const messageListen = {
  request: (messageChannel) => action(MESSAGE_LISTEN[REQUEST], {messageChannels: [messageChannel]}),
  success: (messages) => action(MESSAGE_LISTEN[SUCCESS], {messages}),
  failure: (error) => action(MESSAGE_LISTEN[FAILURE], {error})
};

// Web Socket
export const WATCH_NEW_PROCESS_LOGS = 'WATCH_NEW_PROCESS_LOGS';
export const INIT_BLOCK_HEADER = 'INIT_BLOCK_HEADER';

export function listenToProcessLogs(processName) {
  return {
    type: WATCH_NEW_PROCESS_LOGS,
    processName
  };
}

export function initBlockHeader(){
  return {
    type: INIT_BLOCK_HEADER
  };
}
