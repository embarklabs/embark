import {put, select} from "redux-saga/effects";
import {getAccounts, getBlocks, getTransactions, getContracts} from "../reducers/selectors";
import {fetchAccounts, fetchBlocks, fetchTransactions, fetchContracts} from "./index";

export function *searchExplorer(entity, payload) {
  let result;
  const SEARCH_LIMIT = 100;

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
  yield fetchBlocks({limit: SEARCH_LIMIT});
  const blocks = yield select(getBlocks);
  const intSearchValue = parseInt(payload.searchValue, 10);
  result = blocks.find(block => {
    return block.hash === payload.searchValue || block.number === intSearchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Transactions
  yield fetchTransactions({blockLimit: SEARCH_LIMIT});
  const transactions = yield select(getTransactions);
  result = transactions.find(transaction => {
    return transaction.hash === payload.searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  return yield put(entity.success({error: 'No result found in transactions, accounts or blocks'}));
}
