import Web3 from "web3";

export function isNodeAccount(nodeAccounts, fromAddr) {
  const account = nodeAccounts.find(acc => (
    Web3.utils.toChecksumAddress(acc) ===
    Web3.utils.toChecksumAddress(fromAddr)
  ));
  return !!account;
}

export function handleSignRequest(nodeAccounts, params, callback) {
  try {
    const [fromAddr] = params.request.params;

    // If it's not a node account, we don't send it to the Node as it won't understand it
    if (!isNodeAccount(nodeAccounts, fromAddr)) {
      params.sendToNode = false;
    }
  } catch (err) {
    return callback(err);
  }
  callback(null, params);
}
