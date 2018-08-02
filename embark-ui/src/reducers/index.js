import {combineReducers} from 'redux';
import processesReducer from './processesReducer';
import accountsReducer from './accountsReducer';
import blocksReducer from './blocksReducer';

const rootReducer = combineReducers({
  accounts: accountsReducer,
  processes: processesReducer,
  blocks: blocksReducer
});

export default rootReducer;
