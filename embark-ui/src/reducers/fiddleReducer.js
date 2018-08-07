import {RECEIVE_COMPILE_CODE, RECEIVE_COMPILE_CODE_ERROR} from "../actions";

export default function processes(state = {}, action) {
  switch (action.type) {
    case RECEIVE_COMPILE_CODE:
      return Object.assign({}, state, {data: action.compilationResult});
    case RECEIVE_COMPILE_CODE_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
