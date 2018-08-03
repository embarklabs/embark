import {
  RECEIVE_PROCESSES,
  RECEIVE_PROCESSES_ERROR,
  RECEIVE_PROCESS_LOGS,
  RECEIVE_PROCESS_LOGS_ERROR,
  RECEIVE_NEW_PROCESS_LOG,
  IS_LISTENING_PROCESS_LOG
} from "../actions";

export default function processes(state = {}, action) {
  switch (action.type) {
    case RECEIVE_PROCESSES:
      return Object.assign({}, state, {data: action.processes.data});
    case RECEIVE_PROCESSES_ERROR:
      return Object.assign({}, state, {error: action.error});
    case RECEIVE_PROCESS_LOGS:
      return {
        ...state,
        data: {
          ...state.data,
          [action.processName]: {
              ...state.data[action.processName],
              logs: action.logs.data
            }
        }
      };
    case RECEIVE_NEW_PROCESS_LOG: {
      const logs = state.data[action.processName].logs || [];
      logs.push(action.log);
      return {
        ...state,
        data: {
          ...state.data,
          [action.processName]: {
            ...state.data[action.processName],
            logs: logs
          }
        }
      };
    }
    case IS_LISTENING_PROCESS_LOG: {
      return {
        ...state,
        data: {
          ...state.data,
          [action.processName]: {
            ...state.data[action.processName],
            isListening: true
          }
        }
      };
    }
    case RECEIVE_PROCESS_LOGS_ERROR:
      return Object.assign({}, state, {error: action.error});
    default:
      return state;
  }
}
