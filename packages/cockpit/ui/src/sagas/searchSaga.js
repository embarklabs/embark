import {put, select} from "redux-saga/effects";
import {getAccounts, getBlocks, getTransactions, getContracts, getEnsRecordForName} from "../reducers/selectors";
import {fetchAccounts, fetchBlocks, fetchTransactions, fetchContracts, fetchEnsRecord} from "./index";
import {ELEMENTS_LIMIT} from '../constants';

const ENS_WHITELIST = [
  ".eth",
  ".xyz"
]; // Putting this here as I can't import from embark's constants

export function *searchExplorer(entity, payload) {
  let result;
  let searchValue = payload.searchValue;
  const foundEnsExt = ENS_WHITELIST.find(ensExt => searchValue.endsWith(ensExt));
  if (foundEnsExt) {
    yield fetchEnsRecord({name: payload.searchValue});
    const ensRecord = yield select(getEnsRecordForName, searchValue);

    if (!ensRecord) {
      return yield put(entity.success({error: 'No ENS record for that name'}));
    }
    searchValue = ensRecord.address;
  }

  // Accounts
  yield fetchAccounts({});
  const accounts = yield select(getAccounts);
  result = accounts.find(account => {
    return account.address === searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Contracts
  yield fetchContracts({});
  const contracts = yield select(getContracts);
  result = contracts.find(contract => {
    return contract.deployedAddress === searchValue || contract.className.toLowerCase() === searchValue.toLowerCase();
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Blocks
  yield fetchBlocks({limit: ELEMENTS_LIMIT});
  const blocks = yield select(getBlocks);
  result = blocks.find(block => {
    return block.hash === searchValue || block.number.toString() === searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  // Transactions
  yield fetchTransactions({blockLimit: ELEMENTS_LIMIT});
  const transactions = yield select(getTransactions);
  result = transactions.find(transaction => {
    return transaction.hash === searchValue;
  });

  if (result) {
    return yield put(entity.success(result));
  }

  if (foundEnsExt) {
    return yield put(entity.success({error: `ENS resolved to ${searchValue}, but Embark couldn't find what this address represents`}));
  }

  return yield put(entity.success({error: `No result found in transactions, accounts, contracts, or blocks. Please note: We limit the search to the last ${ELEMENTS_LIMIT} elements for performance`}));
}
