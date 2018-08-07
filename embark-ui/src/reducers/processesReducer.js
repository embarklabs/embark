import * as actions from "../actions";

export default function processes(state = {}, action) {
  switch (action.type) {
    case actions.PROCESSES[actions.SUCCESS]:
      return Object.assign({}, state, {data: action.processes.data});
    case actions.PROCESSES[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    case actions.RECEIVE_PROCESS_LOGS:
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
    case actions.RECEIVE_NEW_PROCESS_LOG: {
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
    case actions.WATCH_NEW_PROCESS_LOGS: {
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
    case actions.RECEIVE_PROCESS_LOGS_ERROR:
      return Object.assign({}, state, {error: action.error});
    default:
      return state;
  }
}
