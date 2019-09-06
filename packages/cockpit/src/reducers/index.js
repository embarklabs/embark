import {combineReducers} from 'redux';
import {REQUEST, SUCCESS, FAILURE, CONTRACT_COMPILE, FILES, LOGOUT, AUTHENTICATE,
        FETCH_CREDENTIALS, UPDATE_BASE_ETHER, CHANGE_THEME, FETCH_THEME, EXPLORER_SEARCH, DEBUGGER_INFO,
        SIGN_MESSAGE, VERIFY_MESSAGE, TOGGLE_BREAKPOINT, UPDATE_PREVIEW_URL,
        UPDATE_DEPLOYMENT_PIPELINE, WEB3_CONNECT, WEB3_DEPLOY, WEB3_ESTIMAGE_GAS, FETCH_EDITOR_TABS,
        SAVE_FILE, SAVE_FOLDER, REMOVE_FILE, DECODED_TRANSACTION, WEB3_IS_DEPLOYED, STOP_DEBUG} from "../actions";
import {EMBARK_PROCESS_NAME, DARK_THEME, DEPLOYMENT_PIPELINES, DEFAULT_HOST, ELEMENTS_LIMIT} from '../constants';

const BN_FACTOR = 10000;
const VOID_ADDRESS = '0x0000000000000000000000000000000000000000';
// This is set so that the total number of logs allowed in the entities state is ELEMENTS_LIMIT
// multipled by the number of services we are monitoring for logs. As it stands currently, we
// are monitoring only "embark" and "blockchain" logs, hence we are allowing ELEMENTS_LIMIT * 2.
// TODO: If we update the number of services to show process logs, we need to update this number
// to reflect the new number of services.
const PROCESS_LOGS_LIMIT = ELEMENTS_LIMIT * 2;

const entitiesDefaultState = {
  accounts: [],
  blocks: [],
  blocksFull: [],
  transactions: [],
  processes: [],
  services: [],
  processLogs: [],
  commandSuggestions: [],
  contracts: [],
  contractProfiles: [],
  contractFunctions: [],
  contractDeploys: [],
  contractCompiles: [],
  contractLogs: [],
  contractEvents: [],
  messages: [],
  messageChannels: [],
  versions: [],
  plugins: [],
  ensRecords: [],
  files: [],
  gasOracleStats: [],
};

const sorter = {
  accounts: function(a, b) {
    return a.index - b.index;
  },
  blocks: function(a, b) {
    return b.number - a.number;
  },
  blocksFull: function(a, b) {
    return b.number - a.number;
  },
  contracts: function (a, b) {
    const aName = a.className || '';
    const bName = b.className || '';
    if (!(aName || bName)) return 0;
    if (!aName) return 1;
    if (!bName) return -1;
    return aName < bName ? -1 : aName > bName ? 1 : 0
  },
  transactions: function(a, b) {
    return ((BN_FACTOR * b.blockNumber) + b.transactionIndex) - ((BN_FACTOR * a.blockNumber) + a.transactionIndex);
  },
  processes: function(a, b) {
    if (a.name === EMBARK_PROCESS_NAME) return -1;
    if (b.name === EMBARK_PROCESS_NAME) return 1;
    return 0;
  },
  commandSuggestions: function(a, b) {
    if (a.value.indexOf('.').length > 0) {
      let a_levels = a.value.split('.').length;
      let b_levels = b.value.split('.').length;
      let diff = b_levels - a_levels;
      if (diff !== 0) return diff * -1;
    }
    let lengthDiff = b.value.length - a.value.length;
    if (lengthDiff !== 0) return lengthDiff * -1;
    return 0;
  },
  processLogs: function(a, b) {
    if (a.name !== b.name) {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    }

    if (a.id === undefined && b.id === undefined) {
      return b.timestamp - a.timestamp;
    }

    return b.id - a.id;
  },
  contractLogs: function(a, b) {
    return a.timestamp - b.timestamp;
  },
  messages: function(a, b) {
    return a.time - b.time;
  },
  files: function(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  },
};

const filters = {
  processes: function(process, index, self) {
    if (["embark", "blockchain"].indexOf(process.name) === -1) return false;
    return index === self.findIndex((t) => t.name === process.name);
  },
  services: function(process, index, self) {
    return index === self.findIndex((t) => t.name === process.name);
  },
  processLogs: function(processLog, index, self) {
    if (processLog.id !== undefined) {
      return index === self.findIndex((p) => p.id === processLog.id && p.name === processLog.name) && index <= PROCESS_LOGS_LIMIT;
    }
    return true;
  },
  contracts: function(contract, index, self) {
    return index === self.findIndex((t) => t.className === contract.className);
  },
  commandSuggestions: function(command, index, self) {
    return index === self.findIndex((c) => (
      command.value === c.value
    ));
  },
  accounts: function(account, index, self) {
    return index === self.findIndex((t) => t.address === account.address);
  },
  blocks: function(block, index, self) {
    if (index > ELEMENTS_LIMIT) {
      return false;
    }

    return index === self.findIndex((t) => t.number === block.number);
  },
  blocksFull: function(block, index, self) {
    if (index > ELEMENTS_LIMIT) {
      return false;
    }

    return index === self.findIndex((t) => t.number === block.number);
  },
  transactions: function(tx, index, self) {
    if (index > ELEMENTS_LIMIT) {
      return false;
    }
    return index === self.findIndex((t) => (
      t.blockNumber === tx.blockNumber && t.transactionIndex === tx.transactionIndex
    ));
  },
  ensRecords: function(record, index, self) {
    return record.name && record.address && record.address !== VOID_ADDRESS && index === self.findIndex((r) => (
      r.address === record.address && r.name === record.name
    ));
  },
  files: function(file, index, self) {
    return index === self.findIndex((f) => (
      file.name === f.name
    ));
  },
  gasOracleStats: function(stat, index, _self) {
    return index === 0; // Only keep last one
  },
  versions: function(version, index, self) {
    return index === self.findIndex((v) => v.value === version.value && v.name === version.name);
  }
};

function entities(state = entitiesDefaultState, action) {
  if (action.type === FILES[SUCCESS]) {
    return {...state, files: action.files};
  }
  for (let name of Object.keys(state)) {
    let filter = filters[name] || (() => true);
    let sort = sorter[name] || (() => 0);
    if (action[name] && action[name].length > 1) {
      return {...state, [name]: [...action[name], ...state[name]].sort(sort).filter(filter)};
    }
    if (action[name] && action[name].length === 1) {
      let entity = action[name][0];
      let nested = Object.keys(state).reduce((acc, entityName) => {
        if (entity && entity[entityName] && entity[entityName].length > 0) {
          let entityFilter = filters[entityName] || (() => true);
          let entitySort = sorter[entityName] || (() => 0);
          acc[entityName] = [...entity[entityName], ...state[entityName]].sort(entitySort).filter(entityFilter);
        }
        return acc;
      }, {});
      return {
        ...state, ...nested, [name]: [...action[name], ...state[name]].sort(sort).filter(filter)
      };
    }
  }

  return state;
}

function errorMessage(_state = null, action) {
  return action.error || null;
}

function errorEntities(state = {}, action) {
  const isSuccess = action.type.endsWith(SUCCESS);
  if (!action.type.endsWith(FAILURE) && !isSuccess) {
    return state;
  }
  let newState = {};
  for (let name of Object.keys(entitiesDefaultState)) {
    if ((action.name && action.name === name) || (action[name] && action[name].length > 0 && action[name][0])) {
      if (isSuccess) {
        newState[name] = null;
      } else {
        newState[name] = action.name ? action.error : action[name][0].error;
      }
      break;
    }
  }
  return {...state, ...newState};
}

function loading(_state = false, action) {
  return action.type.endsWith(REQUEST);
}

function compilingContract(state = false, action) {
  if (action.type === CONTRACT_COMPILE[REQUEST]) {
    return true;
  } else if (action.type === CONTRACT_COMPILE[FAILURE] || action.type === CONTRACT_COMPILE[SUCCESS]) {
    return false;
  }

  return state;
}

const DEFAULT_CREDENTIALS_STATE = {
  host: DEFAULT_HOST,
  token: '',
  authenticated: false,
  authenticating: false,
  error: null
};

function credentials(state = DEFAULT_CREDENTIALS_STATE, action) {
  if (action.type === LOGOUT[SUCCESS]) {
    return DEFAULT_CREDENTIALS_STATE;
  }

  if (action.type === AUTHENTICATE[FAILURE]) {
    return {error: action.error, ...DEFAULT_CREDENTIALS_STATE};
  }

  if (action.type === AUTHENTICATE[SUCCESS]) {
    return {...state, ...{authenticated: true, authenticating: false, token: action.token, host: action.host, error: null}};
  }

  if (action.type === FETCH_CREDENTIALS[SUCCESS]) {
    return {...state, ...{token: action.token, host: action.host}};
  }

  if (action.type === AUTHENTICATE[REQUEST]) {
    return {...state, ...{authenticating: true, error: null}};
  }

  return state;
}

function baseEther(state = '1', action) {
  if (action.type === UPDATE_BASE_ETHER) {
    return action.payload;
  }
  return state;
}

function theme(state=DARK_THEME, action) {
  if (action.type === CHANGE_THEME[REQUEST] || (action.type === FETCH_THEME[SUCCESS] && action.theme)) {
    return action.theme;
  }
  return state
}

function deploymentPipeline(state = DEPLOYMENT_PIPELINES.embark, action) {
  if (action.type === UPDATE_DEPLOYMENT_PIPELINE) {
    return action.payload;
  }
  return state;
}

function searchResult(state = {}, action) {
  if (action.type === EXPLORER_SEARCH[SUCCESS]) {
    return action.searchResult;
  }
  if (action.type === EXPLORER_SEARCH[REQUEST]) {
    return {};
  }
  return state;
}

const DEFAULT_MESSAGE_SIGNATURE_STATE = {
  pending: false,
  error: null,
  payload: null
};

function messageSignature(state = DEFAULT_MESSAGE_SIGNATURE_STATE, action) {

  if (action.type === SIGN_MESSAGE[REQUEST]) {
    return {...state, pending: true, error: null, payload: null };
  }

  if (action.type === SIGN_MESSAGE[FAILURE]) {
    return {...state, pending: false, error: action.signMessageError };
  }

  if (action.type === SIGN_MESSAGE[SUCCESS]) {
    return {...state, ...{
      pending: false,
      error: null,
      payload: {
        signature: action.signature,
        message: action.message,
        signer: action.signer
      }
    }};
  }

  return state;
}

const DEFAULT_MESSAGE_VERIFICATION_STATE = {
  pending: false,
  error: null,
  payload: null
};

function messageVerification(state = DEFAULT_MESSAGE_VERIFICATION_STATE, action) {
  if (action.type === VERIFY_MESSAGE[REQUEST]) {
    return {...state, pending: true, error: null, payload: null };
  }

  if (action.type === VERIFY_MESSAGE[FAILURE]) {
    return {...state, pending: false, error: action.verifyMessageError };
  }

  if (action.type === VERIFY_MESSAGE[SUCCESS]) {
    return {...state, ...{
      pending: false,
      error: null,
      payload: {
        verifiedAddress: action.address
      }
    }};
  }
  return state;
}

function breakpoints(state = {}, action) {
  if (action.type === TOGGLE_BREAKPOINT[SUCCESS]) {
    const {filename, lineNumber} = action.payload;
    let lineNumbers = state[filename] || [];
    if (lineNumbers.includes(lineNumber)){
      lineNumbers = lineNumbers.filter(ln => ln !== lineNumber);
    } else {
      lineNumbers.push(lineNumber);
    }
    return {...state, [filename]: lineNumbers};
  }

  return state;
}

function web3(state = {deployments: {}, gasEstimates: {}, contractsDeployed: {}}, action) {
  if (action.type === WEB3_CONNECT[SUCCESS]) {
    return {...state, instance: action.web3};
  } else if (action.type === WEB3_DEPLOY[REQUEST]) {
    return {...state, deployments: {...state['deployments'], [action.contract.className]: {running: true, error: null}}};
  } else if (action.type === WEB3_DEPLOY[SUCCESS]){
    return {...state, deployments: {...state['deployments'], [action.contract.className]: {...action.receipt, running: false, error: null}}};
  } else if (action.type === WEB3_DEPLOY[FAILURE]){
    return {...state, deployments: {...state['deployments'], [action.contract.className]: {error: action.web3Error, running: false}}};
  } else if (action.type === WEB3_ESTIMAGE_GAS[REQUEST]){
    return {...state, gasEstimates: {...state['gasEstimates'], [action.contract.className]: {running: true, error: null}}};
  } else if (action.type === WEB3_ESTIMAGE_GAS[SUCCESS]){
    return {...state, gasEstimates: {...state['gasEstimates'], [action.contract.className]: {gas: action.gas, running: false, error: null}}};
  } else if (action.type === WEB3_ESTIMAGE_GAS[FAILURE]){
    return {...state, gasEstimates: {...state['gasEstimates'], [action.contract.className]: {error: action.web3Error, running: false}}};
  } else if (action.type === WEB3_IS_DEPLOYED[REQUEST]) {
    return {...state, contractsDeployed: {...state['contractsDeployed'], [action.contract.className]: {running: true, error: null}}};
  } else if (action.type === WEB3_IS_DEPLOYED[SUCCESS]){
    return {...state, contractsDeployed: {...state['contractsDeployed'], [action.contract.className]: {isDeployed: action.isDeployed, running: false, error: null}}};
  } else if (action.type === WEB3_IS_DEPLOYED[FAILURE]){
    return {...state, contractsDeployed: {...state['contractsDeployed'], [action.contract.className]: {error: action.web3Error, running: false}}};
  }

  return state
}

function debuggerInfo(state={}, action) {
  if (action.type === DEBUGGER_INFO[SUCCESS]) {
    return action.data;
  } else if(action.type === STOP_DEBUG[SUCCESS]) {
    return {};
  }
  return state;
}

function editorTabs(state = [], action) {
  if (action.type === FETCH_EDITOR_TABS[SUCCESS] && action.editorTabs) {
    return action.editorTabs;
  }
  return state;
}

function decodedTransaction(state = {}, action) {
  if (action.type === DECODED_TRANSACTION[SUCCESS] && action.transaction) {
    return action.transaction;
  }
  if (action.type === DECODED_TRANSACTION[FAILURE]) {
    return action.error;
  }
  return state;
}

function previewUrl(state= `${window.location.protocol}//${window.location.host}/`, action) {
  if (action.type === UPDATE_PREVIEW_URL) {
    return action.payload;
  }
  return state;
}

const editorOperations = [SAVE_FILE, SAVE_FOLDER, REMOVE_FILE];
function editorOperationStatus(state = {error: '', success: '', loading: false}, action) {
  // Success check
  if (editorOperations.find(operation => operation[SUCCESS] === action.type)) {
    return {error: '', success: 'Operation successful', loading: false};
  }
  // Error check
  if (editorOperations.find(operation => operation[FAILURE] === action.type)) {
    const message = action.error ? action.error.message || action.error : '';
    return {error: 'Error during the process ' + message, success: '', loading: false};
  }
  // Loading check
  if (editorOperations.find(operation => operation[REQUEST] === action.type)) {
    return {error: '', success: '', loading: true};
  }
  return state;
}

const rootReducer = combineReducers({
  entities,
  loading,
  compilingContract,
  errorMessage,
  errorEntities,
  credentials,
  baseEther,
  searchResult,
  messageSignature,
  messageVerification,
  breakpoints,
  deploymentPipeline,
  web3,
  debuggerInfo,
  theme,
  editorTabs,
  previewUrl,
  editorOperationStatus,
  decodedTransaction
});

export default rootReducer;
