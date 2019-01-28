import {EMBARK_PROCESS_NAME} from '../constants';
import {ansiToHtml} from '../utils/utils';

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

export const AUTHENTICATE = createRequestTypes('AUTHENTICATE');
export const authenticate = {
  request: (host, token) => action(AUTHENTICATE[REQUEST], {host, token}),
  success: (result, payload) => { 
    return action(AUTHENTICATE[SUCCESS], {host: payload.host, token: result.token}) 
  },
  failure: (error) => action(AUTHENTICATE[FAILURE], {error})
};

export const CHANGE_THEME = createRequestTypes('CHANGE_THEME');
export const changeTheme = {
  request: (theme) => action(CHANGE_THEME[REQUEST], {theme}),
  success: () => action(CHANGE_THEME[SUCCESS]),
  failure: (error) => action(CHANGE_THEME[FAILURE], {error})
};

export const FETCH_THEME = createRequestTypes('FETCH_THEME');
export const fetchTheme = {
  request: () => action(FETCH_THEME[REQUEST]),
  success: (theme) => action(FETCH_THEME[SUCCESS], {theme}),
  failure: () => action(FETCH_THEME[FAILURE])
};


export const FETCH_CREDENTIALS = createRequestTypes('FETCH_CREDENTIALS');
export const fetchCredentials = {
  request: () => action(FETCH_CREDENTIALS[REQUEST]),
  success: (credentials) => action(FETCH_CREDENTIALS[SUCCESS], credentials),
  failure: () => action(FETCH_CREDENTIALS[FAILURE])
};

export const SAVE_CREDENTIALS = createRequestTypes('SAVE_CREDENTIALS');
export const saveCredentials = {
  request: (credentials) => action(SAVE_CREDENTIALS[REQUEST], credentials),
  success: (credentials) => action(SAVE_CREDENTIALS[SUCCESS], credentials),
  failure: () => action(SAVE_CREDENTIALS[FAILURE])
};

export const LOGOUT = createRequestTypes('LOGOUT');
export const logout = {
  request: () => action(LOGOUT[REQUEST]),
  success: () => action(LOGOUT[SUCCESS]),
  failure: () => action(LOGOUT[FAILURE])
};

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

export const SERVICES = createRequestTypes('SERVICES');
export const services = {
  request: () => action(SERVICES[REQUEST]),
  success: (services) => action(SERVICES[SUCCESS], {services}),
  failure: (error) => action(SERVICES[FAILURE], {error})
};

export const COMMANDS = createRequestTypes('COMMANDS');
export const commands = {
  post: (command) => action(COMMANDS[REQUEST], {command}),
  success: (command, payload) => {
    return action(COMMANDS[SUCCESS], {
      processLogs: [
        {
          timestamp: new Date().getTime(),
          name: EMBARK_PROCESS_NAME,
          msg: `${ansiToHtml(command.result || '')}`,
          command: `console> ${payload.command}<br>`,
			    result: command.result
        }
      ]
    });
  },
  failure: (error) => action(COMMANDS[FAILURE], {error})
};

export const COMMAND_SUGGESTIONS = createRequestTypes('COMMAND_SUGGESTIONS');
export const commandSuggestions = {
  post: (command) => action(COMMAND_SUGGESTIONS[REQUEST], {command}),
  success: (command, payload) => {
    return action(COMMAND_SUGGESTIONS[SUCCESS], {commandSuggestions: command.result })
  },
  failure: (error) => action(COMMAND_SUGGESTIONS[FAILURE], {error})
};

export const PROCESS_LOGS = createRequestTypes('PROCESS_LOGS');
export const processLogs = {
  request: (processName, limit) => {
    return action(PROCESS_LOGS[REQUEST], {processName, limit});
  },
  success: (processLogs) => action(PROCESS_LOGS[SUCCESS], {processLogs}),
  failure: (error) => action(PROCESS_LOGS[FAILURE], {error})
};

export const CONTRACT_LOGS = createRequestTypes('CONTRACT_LOGS');
export const contractLogs = {
  request: () => action(CONTRACT_LOGS[REQUEST]),
  success: (contractLogs) => action(CONTRACT_LOGS[SUCCESS], {contractLogs}),
  failure: (error) => action(CONTRACT_LOGS[FAILURE], {error})
};

export const CONTRACT_EVENTS = createRequestTypes('CONTRACT_EVENTS');
export const contractEvents = {
  request: () => action(CONTRACT_EVENTS[REQUEST]),
  success: (contractEvents) => action(CONTRACT_EVENTS[SUCCESS], {contractEvents}),
  failure: (error) => action(CONTRACT_EVENTS[FAILURE], {error})
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
  post: (contractName, method, inputs, gasPrice) => action(CONTRACT_FUNCTION[REQUEST], {contractName, method, inputs, gasPrice}),
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

export const SIGN_MESSAGE = createRequestTypes('SIGN_MESSAGE');
export const signMessage = {
  request: (message, address) => action(SIGN_MESSAGE[REQUEST], {message, address}),
  success: ({ message, signature, signer}) => action(SIGN_MESSAGE[SUCCESS], {message, signature, signer}),
  failure: (error) => action(SIGN_MESSAGE[FAILURE], { signMessageError: error})
};

export const VERIFY_MESSAGE = createRequestTypes('VERIFY_MESSAGE');
export const verifyMessage = {
  request: (message) => action(VERIFY_MESSAGE[REQUEST], {message}),
  success: ({ error, address }) => action(VERIFY_MESSAGE[SUCCESS], {address, verifyMessageError: error}),
  failure: (error) => action(VERIFY_MESSAGE[FAILURE], {verifyMessageError: error})
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
  success: (file) => action(FILE[SUCCESS], {file}),
  failure: (error) => action(FILE[FAILURE], {error})
};

export const SAVE_FILE = createRequestTypes('SAVE_FILE');
export const saveFile = {
  request: ({name, path, content}) => action(SAVE_FILE[REQUEST], {name, path, content}),
  success: (file) => action(SAVE_FILE[SUCCESS], {file}),
  failure: (error) => action(SAVE_FILE[FAILURE], {error})
};

export const SAVE_FOLDER = createRequestTypes('SAVE_FOLDER');
export const saveFolder = {
  request: ({path}) => action(SAVE_FOLDER[REQUEST], {path}),
  success: () => action(SAVE_FOLDER[SUCCESS]),
  failure: (error) => action(SAVE_FOLDER[FAILURE], {error})
};

export const REMOVE_FILE = createRequestTypes('REMOVE_FILE');
export const removeFile = {
  request: ({name, path, content}) => action(REMOVE_FILE[REQUEST], {name, path, content}),
  success: (_, file) => action(REMOVE_FILE[SUCCESS], {file}),
  failure: (error) => action(REMOVE_FILE[FAILURE], {error})
};

export const GAS_ORACLE = createRequestTypes('GAS_ORACLE');
export const gasOracle = {
  request: () => action(GAS_ORACLE[REQUEST]),
  success: (gasOracleStats) => action(GAS_ORACLE[SUCCESS], {gasOracleStats: [gasOracleStats]}),
  failure: (error) => action(GAS_ORACLE[FAILURE], {error})
};

export const EXPLORER_SEARCH = createRequestTypes('EXPLORER_SEARCH');
export const explorerSearch = {
  request: (searchValue) => action(EXPLORER_SEARCH[REQUEST], {searchValue}),
  success: (searchResult) => action(EXPLORER_SEARCH[SUCCESS], {searchResult}),
  failure: (error) => action(EXPLORER_SEARCH[FAILURE], {error})
};

export const WEB3_CONNECT = createRequestTypes('WEB3_CONNECT');
export const web3Connect = {
  request: () => action(WEB3_CONNECT[REQUEST]),
  success: (web3) => action(WEB3_CONNECT[SUCCESS], {web3}),
  failure: (error) => action(WEB3_CONNECT[FAILURE], {web3Error: error})
};

export const WEB3_DEPLOY = createRequestTypes('WEB3_DEPLOY');
export const web3Deploy = {
  request: (contract, args) => action(WEB3_DEPLOY[REQUEST], {contract, args}),
  success: (receipt, payload) => action(WEB3_DEPLOY[SUCCESS], {contract: payload.contract, receipt}),
  failure: (error, payload) => action(WEB3_DEPLOY[FAILURE], {web3Error: error, contract: payload.contract})
};

export const WEB3_ESTIMAGE_GAS = createRequestTypes('WEB3_ESTIMAGE_GAS');
export const web3EstimateGas = {
  request: (contract, args) => action(WEB3_ESTIMAGE_GAS[REQUEST], {contract, args}),
  success: (gas, payload) => action(WEB3_ESTIMAGE_GAS[SUCCESS], {contract: payload.contract, gas}),
  failure: (error, payload) => action(WEB3_ESTIMAGE_GAS[FAILURE], {web3Error: error, contract: payload.contract})
};

export const START_DEBUG = createRequestTypes('START_DEBUG');
export const startDebug = {
  request: (txHash) => action(START_DEBUG[REQUEST], {txHash}),
  success: () => action(START_DEBUG[SUCCESS]),
  failure: (error) => action(START_DEBUG[FAILURE], {error})
};

export const DEBUG_JUMP_BACK = createRequestTypes('DEBUG_JUMP_BACK');
export const debugJumpBack = {
  request: () => action(DEBUG_JUMP_BACK[REQUEST], {}),
  success: () => action(DEBUG_JUMP_BACK[SUCCESS]),
  failure: (error) => action(DEBUG_JUMP_BACK[FAILURE], {error})
};

export const DEBUG_JUMP_FORWARD = createRequestTypes('DEBUG_JUMP_FORWARD');
export const debugJumpForward = {
  request: () => action(DEBUG_JUMP_FORWARD[REQUEST], {}),
  success: () => action(DEBUG_JUMP_FORWARD[SUCCESS]),
  failure: (error) => action(DEBUG_JUMP_FORWARD[FAILURE], {error})
};

export const DEBUG_STEP_OVER_BACKWARD = createRequestTypes('DEBUG_STEP_OVER_BACKWARD');
export const debugStepOverBackward = {
  request: () => action(DEBUG_STEP_OVER_BACKWARD[REQUEST], {}),
  success: () => action(DEBUG_STEP_OVER_BACKWARD[SUCCESS]),
  failure: (error) => action(DEBUG_STEP_OVER_BACKWARD[FAILURE], {error})
};

export const DEBUG_STEP_OVER_FORWARD = createRequestTypes('DEBUG_STEP_OVER_FORWARD');
export const debugStepOverForward = {
  request: () => action(DEBUG_STEP_OVER_FORWARD[REQUEST], {}),
  success: () => action(DEBUG_STEP_OVER_FORWARD[SUCCESS]),
  failure: (error) => action(DEBUG_STEP_OVER_FORWARD[FAILURE], {error})
};

export const DEBUG_STEP_INTO_BACKWARD = createRequestTypes('DEBUG_STEP_INTO_BACKWARD');
export const debugStepIntoBackward = {
  request: () => action(DEBUG_STEP_INTO_BACKWARD[REQUEST], {}),
  success: () => action(DEBUG_STEP_INTO_BACKWARD[SUCCESS]),
  failure: (error) => action(DEBUG_STEP_INTO_BACKWARD[FAILURE], {error})
};

export const DEBUG_STEP_INTO_FORWARD = createRequestTypes('DEBUG_STEP_INTO_FORWARD');
export const debugStepIntoForward = {
  request: () => action(DEBUG_STEP_INTO_FORWARD[REQUEST], {}),
  success: () => action(DEBUG_STEP_INTO_FORWARD[SUCCESS]),
  failure: (error) => action(DEBUG_STEP_INTO_FORWARD[FAILURE], {error})
};

export const TOGGLE_BREAKPOINT = createRequestTypes('TOGGLE_BREAKPOINT');
export const toggleBreakpoint = {
  request: (filename, lineNumber) => action(TOGGLE_BREAKPOINT[REQUEST], {filename, lineNumber}),
  success: (data, payload) => action(TOGGLE_BREAKPOINT[SUCCESS], {payload}),
  failure: (error) => action(TOGGLE_BREAKPOINT[FAILURE], {error})
};

export const DEBUGGER_INFO = createRequestTypes('DEBUGGER_INFO');
export const debuggerInfo = {
  success: (data) => action(DEBUGGER_INFO[SUCCESS], {data})
};

export const FETCH_EDITOR_TABS = createRequestTypes('FETCH_EDITOR_TABS');
export const fetchEditorTabs = {
  request: () => action(FETCH_EDITOR_TABS[REQUEST]),
  success: (editorTabs) => action(FETCH_EDITOR_TABS[SUCCESS], {editorTabs}),
  failure: () => action(FETCH_EDITOR_TABS[FAILURE])
};

export const ADD_EDITOR_TABS = createRequestTypes('ADD_EDITOR_TABS');
export const addEditorTabs = {
  request: (file) => action(ADD_EDITOR_TABS[REQUEST], {file}),
  success: () => action(ADD_EDITOR_TABS[SUCCESS]),
  failure: () => action(ADD_EDITOR_TABS[FAILURE])
};

export const REMOVE_EDITOR_TABS = createRequestTypes('REMOVE_EDITOR_TABS');
export const removeEditorTabs = {
  request: (file) => action(REMOVE_EDITOR_TABS[REQUEST], {file}),
  success: () => action(REMOVE_EDITOR_TABS[SUCCESS]),
  failure: () => action(REMOVE_EDITOR_TABS[FAILURE])
};

export const INIT_REGULAR_TXS = createRequestTypes('INIT_REGULAR_TXS');
export const initRegularTxs = {
  request: () => action(INIT_REGULAR_TXS[REQUEST], {mode: 'on'}),
  success: () => action(INIT_REGULAR_TXS[SUCCESS]),
  failure: () => action(INIT_REGULAR_TXS[FAILURE])
};

// Web Socket
export const WATCH_NEW_PROCESS_LOGS = 'WATCH_NEW_PROCESS_LOGS';
export const STOP_NEW_PROCESS_LOGS = 'STOP_NEW_PROCESS_LOGS';
export const WATCH_SERVICES = 'WATCH_SERVICES';
export const WATCH_NEW_CONTRACT_LOGS = 'WATCH_NEW_CONTRACT_LOGS';
export const WATCH_NEW_CONTRACT_EVENTS = 'WATCH_NEW_CONTRACT_EVENTS';
export const WATCH_CONTRACTS = 'WATCH_CONTRACTS';
export const INIT_BLOCK_HEADER = 'INIT_BLOCK_HEADER';
export const STOP_BLOCK_HEADER = 'STOP_BLOCK_HEADER';
export const WATCH_GAS_ORACLE = 'WATCH_GAS_ORACLE';
export const STOP_GAS_ORACLE = 'STOP_GAS_ORACLE';
export const STOP_DEBUGGER = 'STOP_DEBUGGER';

export function listenToProcessLogs(processName) {
  return {
    type: WATCH_NEW_PROCESS_LOGS,
    processName
  };
}

export function stopProcessLogs(processName) {
  return {
    type: STOP_NEW_PROCESS_LOGS,
    processName
  };
}

export function listenToServices(){
  return {
    type: WATCH_SERVICES
  };
}

export function listenToContractLogs() {
  return {
    type: WATCH_NEW_CONTRACT_LOGS
  };
}

export function listenToContractEvents() {
  return {
    type: WATCH_NEW_CONTRACT_EVENTS
  };
}

export function initBlockHeader(){
  return {
    type: INIT_BLOCK_HEADER
  };
}

export function stopBlockHeader(){
  return {
    type: STOP_BLOCK_HEADER
  };
}

export function listenToGasOracle(){
  return {
    type: WATCH_GAS_ORACLE
  };
}

export function listenToContracts(){
  return {
    type: WATCH_CONTRACTS
  };
}

export function stopGasOracle(){
  return {
    type: STOP_GAS_ORACLE
  };
}

export function stopDebugger(){
  return {
    type: STOP_DEBUGGER
  }
}

// Actions without Side Effect
export const UPDATE_BASE_ETHER = 'UPDATE_BASE_ETHER';
export function updateBaseEther(value) {
  return {
    type: UPDATE_BASE_ETHER,
    payload: value
  };
}

export const UPDATE_DEPLOYMENT_PIPELINE = 'UPDATE_DEPLOYMENT_PIPELINE';
export function updateDeploymentPipeline(value) {
  return {
    type: UPDATE_DEPLOYMENT_PIPELINE,
    payload: value
  };
}
