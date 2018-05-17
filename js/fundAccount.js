/*global web3, eth*/

(function () {

  var workAccount = '0xDf18Cb4F2005Bc52F94E9BD6C31f7B0C6394E2C2';

  // Blockchain process ends if Javascript ends
  function keepAlive() {
    setInterval(function () {
      // Do nothing
    }, 999999);
  }

  var workAccountBalance = eth.getBalance(workAccount);
  var TARGET = 15000000000000000000;
  if (workAccountBalance >= TARGET) {
    return keepAlive();
  }

  function getNonce() {
    return web3.eth.getTransactionCount(eth.coinbase);
  }

  function getGasPrice() {
    return web3.eth.getGasPrice();
  }

  function sendTransaction(nonce, gasPrice) {
    web3.eth.sendTransaction({
      from: eth.coinbase,
      to: workAccount,
      value: TARGET - workAccountBalance,
      gasPrice: gasPrice,
      nonce: nonce
    }, function (err, _result) {
      if (err) {
        console.error('Error while transferring funds to user account', err);
      }
    });
  }

  try {
    var nonce = getNonce();
    var gasPrice = getGasPrice();
    sendTransaction(nonce, gasPrice);
  } catch (e) {
    console.error('Error while getting nonce or gas price', e);
  }


  keepAlive();
})();
