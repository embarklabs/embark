// Accounts
export const FETCH_ACCOUNTS = 'FETCH_ACCOUNTS';
export const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
export const RECEIVE_ACCOUNTS_ERROR = 'RECEIVE_ACCOUNTS_ERROR';
export const FETCH_ACCOUNT = 'FETCH_ACCOUNT';
export const RECEIVE_ACCOUNT = 'RECEIVE_ACCOUNT';
export const RECEIVE_ACCOUNT_ERROR = 'RECEIVE_ACCOUNT_ERROR';
// Processes
export const FETCH_PROCESSES = 'FETCH_PROCESSES';
export const RECEIVE_PROCESSES = 'RECEIVE_PROCESSES';
export const RECEIVE_PROCESSES_ERROR = 'RECEIVE_PROCESSES_ERROR';
// Process logs
export const FETCH_PROCESS_LOGS = 'FETCH_PROCESS_LOGS';
export const RECEIVE_PROCESS_LOGS = 'RECEIVE_PROCESS_LOGS';
export const WATCH_NEW_PROCESS_LOGS = 'WATCH_NEW_PROCESS_LOGS';
export const RECEIVE_NEW_PROCESS_LOG = 'RECEIVE_NEW_PROCESS_LOG';
export const RECEIVE_PROCESS_LOGS_ERROR = 'RECEIVE_PROCESS_LOGS_ERROR';
// Blocks
export const FETCH_BLOCKS = 'FETCH_BLOCKS';
export const RECEIVE_BLOCKS = 'RECEIVE_BLOCKS';
export const RECEIVE_BLOCKS_ERROR = 'RECEIVE_BLOCKS_ERROR';
export const FETCH_BLOCK = 'FETCH_BLOCK';
export const RECEIVE_BLOCK = 'RECEIVE_BLOCK';
export const RECEIVE_BLOCK_ERROR = 'RECEIVE_BLOCK_ERROR';
// Transactions
export const FETCH_TRANSACTIONS = 'FETCH_TRANSACTIONS';
export const RECEIVE_TRANSACTIONS = 'RECEIVE_TRANSACTIONS';
export const RECEIVE_TRANSACTIONS_ERROR = 'RECEIVE_TRANSACTIONS_ERROR';
export const FETCH_TRANSACTION = 'FETCH_TRANSACTION';
export const RECEIVE_TRANSACTION = 'RECEIVE_TRANSACTION';
export const RECEIVE_TRANSACTION_ERROR = 'RECEIVE_TRANSACTION_ERROR';
// BlockHeader
export const INIT_BLOCK_HEADER = 'INIT_BLOCK_HEADER';

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

export function fetchAccount(address) {
  return {
    type: FETCH_ACCOUNT,
    address
  };
}

export function receiveAccount(account) {
  return {
    type: RECEIVE_ACCOUNT,
    account
  };
}

export function receiveAccountError() {
  return {
    type: RECEIVE_ACCOUNT_ERROR
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

export function receiveProcessesError(error) {
  return {
    type: RECEIVE_PROCESSES_ERROR,
    error
  };
}

export function fetchProcessLogs(processName) {
  return {
    type: FETCH_PROCESS_LOGS,
    processName
  };
}

export function listenToProcessLogs(processName) {
  return {
    type: WATCH_NEW_PROCESS_LOGS,
    processName
  };
}

export function receiveProcessLogs(processName, logs) {
  return {
    type: RECEIVE_PROCESS_LOGS,
    processName,
    logs
  };
}

export function receiveProcessLogsError(error) {
  return {
    type: RECEIVE_PROCESS_LOGS_ERROR,
    error
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

export function fetchBlock(blockNumber) {
  return {
    type: FETCH_BLOCK,
    blockNumber
  };
}

export function receiveBlock(block) {
  return {
    type: RECEIVE_BLOCK,
    block
  };
}

export function receiveBlockError() {
  return {
    type: RECEIVE_BLOCK_ERROR
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

export function fetchTransaction(hash) {
  return {
    type: FETCH_TRANSACTION,
    hash
  };
}

export function receiveTransaction(transaction) {
  return {
    type: RECEIVE_TRANSACTION,
    transaction
  };
}

export function receiveTransactionError() {
  return {
    type: RECEIVE_TRANSACTION_ERROR
  };
}

export function initBlockHeader(){
  return {
    type: INIT_BLOCK_HEADER
  };
}
