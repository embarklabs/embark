import {RECEIVE_CONTRACTS, RECEIVE_CONTRACTS_ERROR} from "../actions";

export default function contracts(state = {}, action) {
  switch (action.type) {
    case RECEIVE_CONTRACTS:
      return Object.assign({}, state, {data: action.contracts.data});
    case RECEIVE_CONTRACTS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
