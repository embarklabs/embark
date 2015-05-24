
setInterval(function() {

  var minimalAmount = (web3.eth.getBalance(web3.eth.coinbase) >= 1500000000000000000);
  if(!web3.eth.mining && (!minimalAmount || web3.eth.pendingTransactions().length > 0)) {
    admin.miner.start();
  }
  else {
    admin.miner.stop();
  }
}, 1000)

