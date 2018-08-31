import {combineReducers} from 'redux';
import {REQUEST, SUCCESS} from "../actions";

const BN_FACTOR = 10000;
const voidAddress = '0x0000000000000000000000000000000000000000';

const entitiesDefaultState = {
  accounts: [],
  blocks: [],
  transactions: [],
  processes: [],
  processLogs: [],
  contracts: [],
  contractProfiles: [],
  contractFiles: [],
  contractFunctions: [],
  contractDeploys: [],
  contractLogs: [],
  commands: [],
  messages: [],
  messageChannels: [],
  fiddles: [],
  fiddleDeploys: [],
  versions: [],
  plugins: [],
  ensRecords: [],
  files: [],
  gasStats: [],
  gasOracleStats: []
};

const sorter = {
  blocks: function(a, b) {
    return b.number - a.number;
  },
  transactions: function(a, b) {
    return ((BN_FACTOR * b.blockNumber) + b.transactionIndex) - ((BN_FACTOR * a.blockNumber) + a.transactionIndex);
  },
  processLogs: function(a, b) {
    return a.timestamp - b.timestamp;
  },
  contractLogs: function(a, b) {
    return a.timestamp - b.timestamp;
  },
  messages: function(a, b) {
    return a.time - b.time;
  },
  commands: function(a, b) {
    return b.timestamp - a.timestamp;
  },
  files: function(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }
};

const filtrer = {
  processes: function(process, index, self) {
    return index === self.findIndex((t) => t.name === process.name);
  },
  contracts: function(contract, index, self) {
    return index === self.findIndex((t) => t.className === contract.className);
  },
  contractFiles: function(contractFile, index, self) {
    return index === self.findIndex((c) => c.filename === contractFile.filename);
  },
  accounts: function(account, index, self) {
    return index === self.findIndex((t) => t.address === account.address);
  },
  blocks: function(block, index, self) {
    return index === self.findIndex((t) => t.number === block.number);
  },
  transactions: function(tx, index, self) {
    return index === self.findIndex((t) => (
      t.blockNumber === tx.blockNumber && t.transactionIndex === tx.transactionIndex
    ));
  },
  ensRecords: function(record, index, self) {
    return record.name && record.address && record.address !== voidAddress && index === self.findIndex((r) => (
      r.address=== record.address && r.name === record.name
    ));
  },
  files: function(file, index, self) {
    return index === self.findIndex((f) => (
      file.name === f.name
    ));
  },
  gasOracleStats: function(stat, index, _self) {
    return index === 0; // Only keep last one
  }
};

function entities(state = entitiesDefaultState, action) {
  for (let name of Object.keys(state)) {
    let filter = filtrer[name] || (() => true);
    let sort = sorter[name] || (() => true);
    if (action[name] && action[name].length > 1) {
      return {...state, [name]: [...action[name], ...state[name]].filter(filter).sort(sort)};
    }
    if (action[name] && action[name].length === 1) {
      let entity = action[name][0];
      let nested = Object.keys(state).reduce((acc, entityName) => {
        if (entity[entityName] && entity[entityName].length > 0) {
          let entityFilter = filtrer[entityName] || (() => true);
          let entitySort = sorter[entityName] || (() => true);
          acc[entityName] = [...entity[entityName], ...state[entityName]].filter(entityFilter).sort(entitySort);
        }
        return acc;
      }, {});
      return {
        ...state, ...nested, [name]: [...action[name], ...state[name]].filter(filter).sort(sort)
      };
    }
  }

  return state;
}

function errorMessage(state = null, action) {
  return action.error || state;
}

function errorEntities(state = {}, action) {
  if (!action.type.endsWith(SUCCESS)) {
    return state;
  }
  let newState = {};
  for (let name of Object.keys(entitiesDefaultState)) {
    if (action[name] && action[name].length > 0) {
      newState[name] = action[name][0].error;
    }
  }
  return {...state, ...newState};
}

function loading(_state = false, action) {
  return action.type.endsWith(REQUEST);
}

const rootReducer = combineReducers({
  entities,
  loading,
  errorMessage,
  errorEntities
});

export default rootReducer;
