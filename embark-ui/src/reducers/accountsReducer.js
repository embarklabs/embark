import {RECEIVE_ACCOUNTS, RECEIVE_ACCOUNTS_ERROR, RECEIVE_ACCOUNT, RECEIVE_ACCOUNT_ERROR} from "../actions";

function filterAccount(account, index, self) {
  return index === self.findIndex((a) => a.address === account.address);
}

export default function accounts(state = {}, action) {
  switch (action.type) {
    case RECEIVE_ACCOUNTS:
      return {
        ...state, data: [...action.accounts.data, ...state.data || []]
          .filter(filterAccount)
      };
    case RECEIVE_ACCOUNTS_ERROR:
      return Object.assign({}, state, {error: true});
    case RECEIVE_ACCOUNT:
      return {
        ...state, data: [action.account.data, ...state.data || []]
          .filter(filterAccount)
      };
    case RECEIVE_ACCOUNT_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
