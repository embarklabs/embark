const Web3 = global.Web3 || require('web3');

let Utils = {
  hexPrefix: function(str) {
    if (!(str && str.match)) return;
    if (str.match(/^0x/)) return str;

    return `0x${str}`;
  },
  fromAscii: function(str) {
    var _web3 = new Web3();
    return _web3.utils ? _web3.utils.fromAscii(str) : _web3.fromAscii(str);
  },
  toAscii: function(str) {
    var _web3 = new Web3();
    return _web3.utils.toAscii(str);
  },
  secureSend: function(web3, toSend, params, isContractDeploy, cb, hashCb) {
    const _cb = function() {};
    const _hashCb = function() {};
    const promise = new Promise((resolve, reject) => {
      let hash;
      let calledBacked = false;
      let interval;

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
        (cb || _cb)(err, receipt);
        if (err) {
          return reject(err);
        }
        resolve(receipt);
      }

      // This interval is there to compensate for the event that sometimes doesn't get triggered when using WebSocket
      // FIXME The issue somehow only happens when the blockchain node is started in the same terminal
      // Only poll with a Websocket provider
      if (web3.currentProvider.constructor.name === 'WebsocketProvider') {
        interval = setInterval(function () {
          if (!hash) {
            return;
          }

          web3.eth.getTransactionReceipt(hash, function (err, receipt) {
            if (!err && !receipt) {
              return;
            }

            callback(err, receipt);
          });
        }, 100);
      }

      //toSend.estimateGas()
      //  .then(gasEstimated => {
      //params.gas = gasEstimated + 1000;
      return toSend.send(params, function(err, transactionHash) {
        if (err) {
          return callback(err);
        }
        hash = transactionHash;
        (hashCb || _hashCb)(hash);
      })
        .on('receipt', function(receipt) {
          if (!isContractDeploy || receipt.contractAddress) {
            callback(null, receipt);
          }
        }).then(function(_contract) {
          if (!hash) {
            return; // Somehow we didn't get the receipt yet... Interval will catch it
          }
          web3.eth.getTransactionReceipt(hash, callback);
        }).catch(callback);
      //});
    });

    if (cb) { promise.then(_cb).catch(_cb); return; }
    return promise;
  }
};

export default Utils;
