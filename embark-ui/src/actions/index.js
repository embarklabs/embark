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
  post: (command) => action(COMMANDS[REQUEST], {command, noLoading: true}),
  success: (command) => action(COMMANDS[SUCCESS], {commands: [{timestamp: new Date().getTime(), ...command}]}),
  failure: (error) => action(COMMANDS[FAILURE], {error})
};

export const PROCESS_LOGS = createRequestTypes('PROCESS_LOGS');
export const processLogs = {
  request: (processName) => action(PROCESS_LOGS[REQUEST], {processName}),
  success: (processLogs) => action(PROCESS_LOGS[SUCCESS], {processLogs}),
  failure: (error) => action(PROCESS_LOGS[FAILURE], {error})
};

export const CONTRACT_LOGS = createRequestTypes('CONTRACT_LOGS');
export const contractLogs = {
  request: () => action(CONTRACT_LOGS[REQUEST]),
  success: (contractLogs) => action(CONTRACT_LOGS[SUCCESS], {contractLogs}),
  failure: (error) => action(CONTRACT_LOGS[FAILURE], {error})
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

export const CONTRACT_FILE = createRequestTypes('CONTRACT_FILE');
export const contractFile = {
  request: (filename) => action(CONTRACT_FILE[REQUEST], {filename}),
  success: (source, payload) => action(CONTRACT_FILE[SUCCESS], {contractFiles: [{source, filename: payload.filename}]}),
  failure: (error) => action(CONTRACT_FILE[FAILURE], {error})
};

export const CONTRACT_FUNCTION = createRequestTypes('CONTRACT_FUNCTION');
export const contractFunction = {
  post: (contractName, method, inputs, gasPrice) => action(CONTRACT_FUNCTION[REQUEST], {contractName, method, inputs, gasPrice, noLoading: true}),
  success: (result, payload) => action(CONTRACT_FUNCTION[SUCCESS], {contractFunctions: [{...result, ...payload}]}),
  failure: (error) => action(CONTRACT_FUNCTION[FAILURE], {error})
};

export const CONTRACT_DEPLOY = createRequestTypes('CONTRACT_DEPLOY');
export const contractDeploy = {
  post: (contractName, method, inputs, gasPrice) => action(CONTRACT_DEPLOY[REQUEST], {contractName, method, inputs, gasPrice}),
  success: (result, payload) => action(CONTRACT_DEPLOY[SUCCESS], {contractDeploys: [{...result, ...payload}]}),
  failure: (error) => action(CONTRACT_DEPLOY[FAILURE], {error})
};

export const CONTRACT_COMPILE = createRequestTypes('CONTRACT_COMPILE');
export const contractCompile = {
  post: (code, name) => action(CONTRACT_COMPILE[REQUEST], {code, name}),
  success: (result, payload) => action(CONTRACT_COMPILE[SUCCESS], {contractCompiles: [{...result, ...payload}]}),
  failure: (error) => action(CONTRACT_COMPILE[FAILURE], {error})
};

export const VERSIONS = createRequestTypes('VERSIONS');
export const versions = {
  request: () => action(VERSIONS[REQUEST]),
  success: (versions) => action(VERSIONS[SUCCESS], {versions}),
  failure: (error) => action(VERSIONS[FAILURE], {error})
};

export const PLUGINS = createRequestTypes('PLUGINS');
export const plugins = {
  request: () => action(PLUGINS[REQUEST]),
  success: (plugins) => action(PLUGINS[SUCCESS], {plugins}),
  failure: (error) => action(PLUGINS[FAILURE], {error})
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

export const ENS_RECORD = createRequestTypes('ENS_RECORD');
export const ensRecord = {
  resolve: (name) => action(ENS_RECORD[REQUEST], {name}),
  lookup: (address) => action(ENS_RECORD[REQUEST], {address}),
  success: (record, payload) => action(ENS_RECORD[SUCCESS], {ensRecords: [Object.assign(payload, record)]}),
  failure: (error) => action(ENS_RECORD[FAILURE], {error})
};

export const ENS_RECORDS = createRequestTypes('ENS_RECORDS');
export const ensRecords = {
  post: (subdomain, address) => action(ENS_RECORDS[REQUEST], {subdomain, address}),
  success: (record) => action(ENS_RECORDS[SUCCESS], {ensRecords: [record]}),
  failure: (error) => action(ENS_RECORDS[FAILURE], {error})
};

export const FILES = createRequestTypes('FILES');
export const files = {
  request: () => action(FILES[REQUEST]),
  success: (files) => action(FILES[SUCCESS], {files: files}),
  failure: (error) => action(FILES[FAILURE], {error})
};

export const FILE = createRequestTypes('FILE');
export const file = {
  request: (file) => action(FILE[REQUEST], file),
  success: (file) => action(FILE[SUCCESS], file),
  failure: (error) => action(FILE[FAILURE], {error})
};

export const SAVE_FILE = createRequestTypes('SAVE_FILE');
export const saveFile = {
  request: ({name, path, content}) => {
    return action(SAVE_FILE[REQUEST], {name, path, content});
  },
  success: () => action(SAVE_FILE[SUCCESS]),
  failure: (error) => action(SAVE_FILE[FAILURE], {error})
};

export const REMOVE_FILE = createRequestTypes('REMOVE_FILE');
export const removeFile = {
  request: ({name, path, content}) => action(REMOVE_FILE[REQUEST], {name, path, content}),
  success: () => action(REMOVE_FILE[SUCCESS]),
  failure: (error) => action(REMOVE_FILE[FAILURE], {error})
};

export const CURRENT_FILE = createRequestTypes('CURRENT_FILE');
export const currentFile = {
  request: () => action(CURRENT_FILE[REQUEST]),
  success: (file) => action(CURRENT_FILE[SUCCESS], {currentFiles: [file]}),
  failure: () => action(CURRENT_FILE[FAILURE])
};

export const SAVE_CURRENT_FILE = createRequestTypes('SAVE_CURRENT_FILE');
export const saveCurrentFile = {
  request: (file) => action(SAVE_CURRENT_FILE[REQUEST], file),
  success: (file) => action(SAVE_CURRENT_FILE[SUCCESS], {currentFiles: [file]}),
  failure: () => action(SAVE_CURRENT_FILE[FAILURE])
};

export const GAS_ORACLE = createRequestTypes('GAS_ORACLE');
export const gasOracle = {
  request: () => action(GAS_ORACLE[REQUEST]),
  success: (gasOracleStats) => action(GAS_ORACLE[SUCCESS], {gasOracleStats: [gasOracleStats]}),
  failure: (error) => action(GAS_ORACLE[FAILURE], {error})
};

// Web Socket
export const WATCH_NEW_PROCESS_LOGS = 'WATCH_NEW_PROCESS_LOGS';
export const WATCH_NEW_CONTRACT_LOGS = 'WATCH_NEW_CONTRACT_LOGS';
export const INIT_BLOCK_HEADER = 'INIT_BLOCK_HEADER';
export const WATCH_GAS_ORACLE = 'WATCH_GAS_ORACLE';

export function listenToProcessLogs(processName) {
  return {
    type: WATCH_NEW_PROCESS_LOGS,
    processName
  };
}

export function listenToContractLogs() {
  return {
    type: WATCH_NEW_CONTRACT_LOGS
  };
}

export function initBlockHeader(){
  return {
    type: INIT_BLOCK_HEADER
  };
}

export function listenToGasOracle(){
  return {
    type: WATCH_GAS_ORACLE
  };
}


