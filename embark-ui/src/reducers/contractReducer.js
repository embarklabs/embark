import {RECEIVE_CONTRACT, RECEIVE_CONTRACT_ERROR} from "../actions";

export default function contract(state = {}, action) {
  switch (action.type) {
    case RECEIVE_CONTRACT:
      return Object.assign({}, state, {data: action.contract.data});
    case RECEIVE_CONTRACT_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
