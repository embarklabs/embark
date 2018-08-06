import * as actions from "../actions";

function filterAccount(account, index, self) {
  return index === self.findIndex((a) => a.address === account.address);
}

export default function accounts(state = {}, action) {
  switch (action.type) {
    case actions.ACCOUNTS[actions.SUCCESS]:
      return {
        ...state, data: [...action.accounts.data, ...state.data || []]
          .filter(filterAccount)
      };
    case actions.ACCOUNTS[actions.FAILURE]:
      return Object.assign({}, state, {error: true});
    case actions.ACCOUNT[actions.SUCCESS]:
      return {
        ...state, data: [action.account.data, ...state.data || []]
          .filter(filterAccount)
      };
    case actions.ACCOUNT[actions.FAILURE]:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
