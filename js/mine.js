var miner_var;

if (admin.miner === undefined) {
  miner_var = miner;
}
else {
  miner_var = admin.miner;
}

miner_var.setEtherbase(web3.eth.accounts[0]);

setInterval(function() {
  var minimalAmount = (web3.eth.getBalance(web3.eth.coinbase) >= 15000000000000000000);
  var pendingTransactions = function() {
    if (web3.eth.pendingTransactions === undefined || web3.eth.pendingTransactions === null) {
      return txpool.status.pending || txpool.status.queued;
    }
    else if (typeof web3.eth.pendingTransactions === "function")  {
      return web3.eth.pendingTransactions().length > 0;
    }
    else {
      return web3.eth.pendingTransactions.length > 0 || web3.eth.getBlock('pending').transactions.length > 0;
    }
  }

  if(!web3.eth.mining && (!minimalAmount || pendingTransactions())) {
    if (!minimalAmount) { console.log("=== minimal ether amount not reached yet") }
    if (pendingTransactions()) { console.log("=== there are pending transactions") }
    console.log("=== start mining");
    miner_var.start();
  }
  else if (web3.eth.mining && minimalAmount && !pendingTransactions()) {
    if (minimalAmount) { console.log("=== minimal ether amount reached") }
    if (!pendingTransactions()) { console.log("=== no pending transactions") }
    console.log("=== stop mining");
    miner_var.stop();
  }
}, 1000)

