import {RECEIVE_ACCOUNTS, RECEIVE_ACCOUNTS_ERROR, RECEIVE_ACCOUNT, RECEIVE_ACCOUNT_ERROR} from "../actions";

export default function accounts(state = {}, action) {
  switch (action.type) {
    case RECEIVE_ACCOUNTS:
      return Object.assign({}, state, {data: action.accounts.data});
    case RECEIVE_ACCOUNTS_ERROR:
      return Object.assign({}, state, {error: true});
    case RECEIVE_ACCOUNT:
      return Object.assign({}, state, {data: action.account.data});
    case RECEIVE_ACCOUNT_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
