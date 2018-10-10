const async = require('async');
const TARGET = 0x7FFFFFFFFFFFFFFF;
const ALREADY_FUNDED = 'alreadyFunded';

function fundAccount(web3, accountAddress, hexBalance, callback) {
  if (!hexBalance) {
    hexBalance = TARGET;
  }
  const targetBalance = (typeof hexBalance === 'string') ? parseInt(hexBalance, 16) : hexBalance;
  let accountBalance;
  let coinbaseAddress;
  let lastNonce;
  let gasPrice;

  async.waterfall([
    function getAccountBalance(next) {
      web3.eth.getBalance(accountAddress, (err, balance) => {
        if (err) {
          return next(err);
        }
        if (balance >= targetBalance) {
          return next(ALREADY_FUNDED);
        }
        accountBalance = balance;
        next();
      });
    },
    function getNeededParams(next) {
      async.parallel([
        function getCoinbaseAddress(paraCb) {
          web3.eth.getCoinbase()
            .then((address) => {
              coinbaseAddress = address;
              paraCb();
            }).catch(paraCb);
        },
        function getGasPrice(paraCb) {
          web3.eth.getGasPrice((err, price) => {
            if (err) {
              return paraCb(err);
            }
            gasPrice = price;
            paraCb();
          });
        }
      ], (err, _result) => {
        next(err);
      });
    },
    function getNonce(next) {
      web3.eth.getTransactionCount(coinbaseAddress, (err, nonce) => {
        if (err) {
          return next(err);
        }
        lastNonce = nonce;
        next();
      });
    },
    function sendTransaction(next) {
      web3.eth.sendTransaction({
        from: coinbaseAddress,
        to: accountAddress,
        value: targetBalance - accountBalance,
        gasPrice: gasPrice,
        nonce: lastNonce
      }, next);
    }
  ], (err) => {
    if (err && err !== ALREADY_FUNDED) {
      return callback(err);
    }
    callback();
  });
}

module.exports = fundAccount;
