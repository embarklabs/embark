import isToday from 'date-fns/is_today';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';

export function formatContractForDisplay(contract) {
  let address = (contract.address || contract.deployedAddress);
  let state = 'Deployed';
  let stateColor = 'success';
  if (contract.deploy === false) {
    address = 'Interface or set to not deploy';
    state = 'N/A';
    stateColor = 'info';
  } else if (contract.error) {
    address = contract.error;
    state = 'Error';
    stateColor = 'danger';
  } else if (!address) {
    address = '...';
    state = 'Pending';
    stateColor = 'warning';
  }
  return {address, state, stateColor};
}

export function formatTimestampForDisplay(timestamp) {
  if (isToday(new Date(timestamp * 1000))) {
    return distanceInWordsToNow(new Date(timestamp * 1000), {addSuffix: true});
  }
  return new Date(timestamp * 1000).toLocaleString();
}
