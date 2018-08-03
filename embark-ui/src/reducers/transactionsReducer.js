import {RECEIVE_TRANSACTIONS, RECEIVE_TRANSACTIONS_ERROR} from "../actions";

const BN_FACTOR = 10000;

export default function transactions(state = {}, action) {
  switch (action.type) {
    case RECEIVE_TRANSACTIONS:
      return {
        ...state, data: [...state.data || [], ...action.transactions.data]
          .filter((tx, index, self) => index === self.findIndex((t) => (
            t.blockNumber === tx.blockNumber && t.transactionIndex === tx.transactionIndex
          )))
          .sort((a, b) => (
            ((BN_FACTOR * b.blockNumber) + b.transactionIndex) - ((BN_FACTOR * a.blockNumber) + a.transactionIndex))
          )
      };
    case RECEIVE_TRANSACTIONS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
