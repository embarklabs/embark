import {RECEIVE_TRANSACTION, RECEIVE_TRANSACTION_ERROR, RECEIVE_TRANSACTIONS, RECEIVE_TRANSACTIONS_ERROR} from "../actions";

const BN_FACTOR = 10000;

function sortTransaction(a, b) {
  return ((BN_FACTOR * b.blockNumber) + b.transactionIndex) - ((BN_FACTOR * a.blockNumber) + a.transactionIndex);
}

function filterTransaction(tx, index, self) {
  return index === self.findIndex((t) => (
    t.blockNumber === tx.blockNumber && t.transactionIndex === tx.transactionIndex
  ));
}

export default function transactions(state = {}, action) {
  switch (action.type) {
    case RECEIVE_TRANSACTIONS:
      return {
        ...state, data: [...action.transactions.data, ...state.data || []]
          .filter(filterTransaction)
          .sort(sortTransaction)
      };
    case RECEIVE_TRANSACTIONS_ERROR:
      return Object.assign({}, state, {error: true});
    case RECEIVE_TRANSACTION:
      return {
        ...state, data: [action.transaction.data, ...state.data || []]
          .filter(filterTransaction)
          .sort(sortTransaction)
      };
    case RECEIVE_TRANSACTION_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
