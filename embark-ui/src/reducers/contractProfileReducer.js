import {RECEIVE_CONTRACT_PROFILE, RECEIVE_CONTRACT_PROFILE_ERROR} from "../actions";

export default function contractProfile(state = {}, action) {
  console.dir("** reducer contract profile");
  console.dir(arguments);
  switch (action.type) {
    case RECEIVE_CONTRACT_PROFILE:
      return Object.assign({}, state, {data: action.contractProfile.data});
    case RECEIVE_CONTRACT_PROFILE_ERROR:
      return Object.assign({}, state, {error: true});
    default:
      return state;
  }
}
