
function secureSend(web3, toSend, params, isContractDeploy, cb) {
  cb = cb || function(){};
  return  new Promise((resolve, reject) => {
    let hash;
    let calledBacked = false;

    function callback(err, receipt) {
      if (calledBacked) {
        return;
      }
      if (!err && (isContractDeploy && !receipt.contractAddress)) {
        return; // Not deployed yet. Need to wait
      }
      if (interval) {
        clearInterval(interval);
      }
      calledBacked = true;
      cb(err, receipt);
      if (err) {
        return reject(err);
      }
      resolve(receipt);
    }

    // This interval is there to compensate for the event that sometimes doesn't get triggered when using WebSocket
    // FIXME The issue somehow only happens when the blockchain node is started in the same terminal
    const interval = setInterval(() => {
      if (!hash) {
        return; // Wait until we receive the hash
      }
      web3.eth.getTransactionReceipt(hash, (err, receipt) => {
        if (!err && !receipt) {
          return; // Transaction is not yet complete
        }
        callback(err, receipt);
      });
    }, 100);

    toSend.estimateGas()
      .then(gasEstimated => {
        params.gas = gasEstimated + 1000;
        return toSend.send(params, function(err, transactionHash) {
          if (err) {
            return callback(err);
          }
          hash = transactionHash;
        }).on('receipt', function(receipt) {
          if (!isContractDeploy || receipt.contractAddress) {
            callback(null, receipt);
          }
        }).then(function(_contract) {
          if (!hash) {
            return; // Somehow we didn't get the receipt yet... Interval will catch it
          }
          web3.eth.getTransactionReceipt(hash, callback);
        }).catch(callback);
      });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = secureSend;
}
