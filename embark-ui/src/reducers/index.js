import {combineReducers} from 'redux';
import processesReducer from './processesReducer';
import accountsReducer from './accountsReducer';
import blocksReducer from './blocksReducer';
import transactionsReducer from './transactionsReducer';
import commandsReducer from './commandsReducer';

const rootReducer = combineReducers({
  accounts: accountsReducer,
  processes: processesReducer,
  blocks: blocksReducer,
  transactions: transactionsReducer,
  commands: commandsReducer
});

export default rootReducer;
