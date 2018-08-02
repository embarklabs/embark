import {combineReducers} from 'redux';
import processesReducer from './processesReducer';
import accountsReducer from './accountsReducer';
import blocksReducer from './blocksReducer';
import transactionsReducer from './transactionsReducer';

const rootReducer = combineReducers({
  accounts: accountsReducer,
  processes: processesReducer,
  blocks: blocksReducer,
  transactions: transactionsReducer
});

export default rootReducer;
