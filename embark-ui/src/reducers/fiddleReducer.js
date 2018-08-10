import {COMPILE_CODE_REQUEST, COMPILE_CODE_FAILURE, COMPILE_CODE_SUCCESS} from "../actions";

export default function processes(state = {}, action) {
  switch (action.type) {
    case COMPILE_CODE_REQUEST:
    return {...state,  isFetching: true, compilationResult: action.compilationResult};
    case COMPILE_CODE_SUCCESS:
      return {...state,  isFetching: false, compilationResult: action.compilationResult};
    case COMPILE_CODE_FAILURE:
      return {...state,  isFetching: false, error: true};
    default:
      return state;
  }
}
