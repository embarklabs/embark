
setInterval(function() {
  if(web3.eth.pendingTransactions().length > 0 && !web3.eth.mining) {
    admin.miner.start();
  }
  else {
    admin.miner.stop();
  }
}, 1000)

