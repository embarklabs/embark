import * as actions from "../actions";

export default function commands(state = {}, action) {
  switch (action.type) {
    case actions.COMMANDS[actions.SUCCESS]:
      return {
        ...state, error: null, results: [...state.results || [], action.result.data.result]
      };
    case actions.COMMANDS[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    default:
      return state;
  }
}
