
setInterval(function() {

  var minimalAmount = (web3.eth.getBalance(web3.eth.coinbase) >= 1500000000000000000);
  var pendingTransactions = web3.eth.pendingTransactions().length > 0;

  if(!web3.eth.mining && (!minimalAmount || pendingTransactions)) {
    if (!minimalAmount) { console.log("=== minimal ether amount not reached yet") }
    if (pendingTransactions) { console.log("=== there are pending transactions") }
    console.log("=== start mining");
    admin.miner.start();
  }
  else if (web3.eth.mining && minimalAmount && minimalAmount) {
    if (minimalAmount) { console.log("=== minimal ether amount reached") }
    if (pendingTransactions) { console.log("=== no pending transactions") }
    console.log("=== stop mining");
    admin.miner.stop();
  }
}, 1000)

