import {RECEIVE_TRANSACTIONS, RECEIVE_TRANSACTIONS_ERROR} from "../actions";

export default function transactions(state = {}, action) {
  switch (action.type) {
    case RECEIVE_TRANSACTIONS:
      return {...state, data: [...state.data || [], ...action.transactions.data]};
    case RECEIVE_TRANSACTIONS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
