import {RECEIVE_ACCOUNTS, RECEIVE_ACCOUNTS_ERROR} from "../actions";

export default function accounts(state = {}, action) {
  switch (action.type) {
    case RECEIVE_ACCOUNTS:
      return {...state, data: [...state.data || [], ...action.accounts.data]};
    case RECEIVE_ACCOUNTS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
