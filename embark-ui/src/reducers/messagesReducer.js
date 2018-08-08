import * as actions from "../actions";

export default function messages(state = {channels: {}}, action) {
  switch (action.type) {
    case actions.MESSAGE_LISTEN[actions.SUCCESS]: {
      const messages = state.channels[action.channel] ? state.channels[action.channel].messages : [];
      messages.push(action.message.data);
      return {
        ...state,
        channels: {
          ...state.channels,
          [action.channel]: {
            ...state.channels[action.channel],
            messages: messages
          }
        }
      };
    }
    default:
      return state;
  }
}
