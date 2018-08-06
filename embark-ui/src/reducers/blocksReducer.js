import * as actions from "../actions";

function sortBlock(a, b) {
  return b.number - a.number;
}

function filterBlock(block, index, self) {
  return index === self.findIndex((t) => t.number === block.number);
}

export default function blocks(state = {}, action) {
  switch (action.type) {
    case actions.BLOCKS[actions.SUCCESS]:
      return {
        ...state, error: null, data: [...action.blocks.data, ...state.data || []]
          .filter(filterBlock)
          .sort(sortBlock)
      };
    case actions.BLOCKS[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    case actions.BLOCK[actions.SUCCESS]:
      return {
        ...state, error: null, data: [action.block.data, ...state.data || []]
          .filter(filterBlock)
          .sort(sortBlock)
      };
    case actions.BLOCK[actions.FAILURE]:
      return Object.assign({}, state, {error: action.error});
    default:
      return state;
  }
}
