import {RECEIVE_BLOCK, RECEIVE_BLOCK_ERROR, RECEIVE_BLOCKS, RECEIVE_BLOCKS_ERROR} from "../actions";

function sortBlock(a, b) {
  return b.number - a.number;
}

function filterBlock(block, index, self) {
  return index === self.findIndex((t) => t.number === block.number);
}

export default function blocks(state = {}, action) {
  switch (action.type) {
    case RECEIVE_BLOCKS:
      return {
        ...state, data: [...action.blocks.data, ...state.data || []]
          .filter(filterBlock)
          .sort(sortBlock)
      };
    case RECEIVE_BLOCKS_ERROR:
      return Object.assign({}, state, {error: true});
    case RECEIVE_BLOCK:
      return {
        ...state, data: [action.block.data, ...state.data || []]
          .filter(filterBlock)
          .sort(sortBlock)
      };
    case RECEIVE_BLOCK_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
