import {RECEIVE_BLOCKS, RECEIVE_BLOCKS_ERROR} from "../actions";

export default function blocks(state = {}, action) {
  switch (action.type) {
    case RECEIVE_BLOCKS:
      return {...state, data: [...state.data || [], ...action.blocks.data]};
    case RECEIVE_BLOCKS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
