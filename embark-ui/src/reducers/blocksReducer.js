import {RECEIVE_BLOCKS, RECEIVE_BLOCKS_ERROR} from "../actions";

export default function blocks(state = {}, action) {
  switch (action.type) {
    case RECEIVE_BLOCKS:
      return {
        ...state, data: [...state.data || [], ...action.blocks.data]
          .filter((block, index, self) => index === self.findIndex((t) => t.number === block.number))
          .sort((a, b) => b.number - a.number)
      };
    case RECEIVE_BLOCKS_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
