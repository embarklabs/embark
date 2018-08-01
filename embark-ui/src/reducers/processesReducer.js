import {RECEIVE_PROCESSES, RECEIVE_PROCESSES_ERROR} from "../actions";

export default function processes(state = {}, action) {
  switch (action.type) {
    case RECEIVE_PROCESSES:
      return Object.assign({}, state, {data: action.processes.data});
    case RECEIVE_PROCESSES_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
