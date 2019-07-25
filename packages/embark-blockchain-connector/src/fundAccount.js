const TARGET = 0x7FFFFFFFFFFFFFFF;

async function fundAccount(web3, accountAddress, coinbaseAddress, hexBalance) {
  if (!hexBalance) {
    hexBalance = TARGET;
  }
  const targetBalance = web3.utils.toBN(hexBalance);

  // chekck if account is already funded
  let accountBalance = await web3.eth.getBalance(accountAddress);
  accountBalance = web3.utils.toBN(accountBalance);
  if (accountBalance.gte(targetBalance)) {
    return;
  }

  // run in parallel
  let getGasPricePromise = web3.eth.getGasPrice(); 
  let getTxCountPromise = web3.eth.getTransactionCount(coinbaseAddress);

  const [gasPrice, lastNonce] = await Promise.all([getGasPricePromise, getTxCountPromise]);

  return web3.eth.sendTransaction({
    from: coinbaseAddress,
    to: accountAddress,
    value: targetBalance.sub(accountBalance),
    gasPrice: gasPrice,
    nonce: lastNonce
  });  
}

module.exports = fundAccount;
