import {combineReducers} from 'redux';
import {REQUEST} from "../actions";

const BN_FACTOR = 10000;

const entitiesDefaultState = {
  accounts: [],
  blocks: [],
  transactions: [],
  processes: [],
  processLogs: [],
  contracts: [],
  contractProfiles: [],
  commands: []
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
  }
};

const filtrer = {
  processes: function(process, index, self) {
    return index === self.findIndex((t) => t.name === process.name);
  },
  contracts: function(contract, index, self) {
    return index === self.findIndex((t) => t.name === contract.name);
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

function loading(_state = false, action) {
  return action.type.endsWith(REQUEST);
}

const rootReducer = combineReducers({
  entities,
  loading,
  errorMessage
});

export default rootReducer;
