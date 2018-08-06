// Accounts
export const REQUEST = 'REQUEST';
export const SUCCESS = 'SUCCESS';
export const FAILURE = 'FAILURE';

function createRequestTypes(base) {
  return [REQUEST, SUCCESS, FAILURE].reduce((acc, type) => {
    acc[type] = `${base}_${type}`;
    return acc;
  }, {});
}

function action(type, payload = {}) {
  return {type, ...payload};
}

export const ACCOUNTS = createRequestTypes('ACCOUNTS');
export const accounts = {
  request: () => action(ACCOUNTS[REQUEST]),
  success: (accounts) => action(ACCOUNTS[SUCCESS], {accounts}),
  failure: (error) => action(ACCOUNTS[FAILURE], {error})
};

export const ACCOUNT = createRequestTypes('ACCOUNT');
export const account = {
  request: (address) => action(ACCOUNT[REQUEST], {address}),
  success: (account) => action(ACCOUNT[SUCCESS], {account}),
  failure: (error) => action(ACCOUNT[FAILURE], {error})
};

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
