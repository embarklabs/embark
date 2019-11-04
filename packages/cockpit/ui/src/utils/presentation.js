import isToday from 'date-fns/isToday';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

export function formatContractForDisplay(contract) {
  let address = contract.deployedAddress;
  let name = contract.className;
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
  return {address, name, state, stateColor};
}

export function formatTimestampForDisplay(timestamp) {
  if (isToday(new Date(timestamp * 1000))) {
    return formatDistanceToNow(new Date(timestamp * 1000), {addSuffix: true});
  }
  return new Date(timestamp * 1000).toLocaleString();
}
