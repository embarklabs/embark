// Accounts
export const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
export const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
export const RECEIVE_ACCOUNTS_ERROR = 'RECEIVE_ACCOUNTS_ERROR';
// Processes
export const FETCH_PROCESSES = 'FETCH_PROCESSES';
export const RECEIVE_PROCESSES = 'RECEIVE_PROCESSES';
export const RECEIVE_PROCESSES_ERROR = 'RECEIVE_PROCESSES_ERROR';
// Blocks
export const FETCH_BLOCKS = 'FETCH_BLOCKS';
export const RECEIVE_BLOCKS = 'RECEIVE_BLOCKS';
export const RECEIVE_BLOCKS_ERROR = 'RECEIVE_BLOCKS_ERROR';
// Transactions
export const FETCH_TRANSACTIONS = 'FETCH_TRANSACTIONS';
export const RECEIVE_TRANSACTIONS = 'RECEIVE_TRANSACTIONS';
export const RECEIVE_TRANSACTIONS_ERROR = 'RECEIVE_TRANSACTIONS_ERROR';

export function fetchAccounts() {
  return {
    type: FETCH_ACCOUNTS
  };
}

export function receiveAccounts(accounts) {
  return {
    type: RECEIVE_ACCOUNTS,
    accounts
  };
}

export function receiveAccountsError() {
  return {
    type: RECEIVE_ACCOUNTS_ERROR
  };
}

export function fetchProcesses() {
  return {
    type: FETCH_PROCESSES
  };
}

export function receiveProcesses(processes) {
  return {
    type: RECEIVE_PROCESSES,
    processes
  };
}

export function receiveProcessesError() {
  return {
    type: RECEIVE_PROCESSES_ERROR
  };
}

export function fetchBlocks(from) {
  return {
    type: FETCH_BLOCKS,
    from
  };
}

export function receiveBlocks(blocks) {
  return {
    type: RECEIVE_BLOCKS,
    blocks
  };
}

export function receiveBlocksError() {
  return {
    type: RECEIVE_BLOCKS_ERROR
  };
}

export function fetchTransactions(blockFrom) {
  return {
    type: FETCH_TRANSACTIONS,
    blockFrom
  };
}

export function receiveTransactions(transactions) {
  return {
    type: RECEIVE_TRANSACTIONS,
    transactions
  };
}

export function receiveTransactionsError() {
  return {
    type: RECEIVE_TRANSACTIONS_ERROR
  };
}
