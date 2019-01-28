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
