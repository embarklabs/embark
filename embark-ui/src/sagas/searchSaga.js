import {put, select} from "redux-saga/effects";
import {getAccounts, getBlocks, getTransactions, getContracts} from "../reducers/selectors";
import {fetchAccounts, fetchBlocks, fetchTransactions, fetchContracts} from "./index";
import {ELEMENTS_LIMIT} from '../constants';

export function *searchExplorer(entity, payload) {
  let result;

  // Accounts
  yield fetchAccounts({});
  const accounts = yield select(getAccounts);
  result = accounts.find(account => {
    return account.address === payload.searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Contracts
  yield fetchContracts({});
  const contracts = yield select(getContracts);
  result = contracts.find(contract => {
    return contract.address === payload.searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Blocks
  yield fetchBlocks({limit: ELEMENTS_LIMIT});
  const blocks = yield select(getBlocks);
  const intSearchValue = parseInt(payload.searchValue, 10);
  result = blocks.find(block => {
    return block.hash === payload.searchValue || block.number === intSearchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Transactions
  yield fetchTransactions({blockLimit: ELEMENTS_LIMIT});
  const transactions = yield select(getTransactions);
  result = transactions.find(transaction => {
    return transaction.hash === payload.searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  return yield put(entity.success({error: `No result found in transactions, accounts, contracts, or blocks. Please note: We limit the search to the last ${ELEMENTS_LIMIT} elements for performance`}));
}
