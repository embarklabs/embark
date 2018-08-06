import * as actions from "../actions";

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
    case actions.TRANSACTIONS[actions.SUCCESS]:
      return {
        ...state, error: null, data: [...action.transactions.data, ...state.data || []]
          .filter(filterTransaction)
          .sort(sortTransaction)
      };
    case actions.TRANSACTIONS[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    case actions.TRANSACTION[actions.SUCCESS]:
      return {
        ...state, error: null, data: [action.transaction.data, ...state.data || []]
          .filter(filterTransaction)
          .sort(sortTransaction)
      };
    case actions.TRANSACTION[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    default:
      return state;
  }
}
