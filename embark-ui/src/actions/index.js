export const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
export const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
export const RECEIVE_ACCOUNTS_ERROR = 'RECEIVE_ACCOUNTS_ERROR';

export function fetchAccounts() {
  return {
    type: FETCH_ACCOUNTS
  };
};

export function receiveAccounts(accounts) {
  return {
    type: RECEIVE_ACCOUNTS,
    accounts: accounts
  };
};

export function receiveAccountsError() {
  return {
    type: RECEIVE_ACCOUNTS_ERROR
  };
};
