import Web3 from "web3";

const TARGET = 0x7FFFFFFFFFFFFFFF;

export default async function fundAccount(web3: Web3, accountAddress: string, coinbaseAddress: string, hexBalance?: string | number) {
  if (!hexBalance) {
    hexBalance = TARGET;
  }
  const targetBalance = web3.utils.toBN(hexBalance);

  // check if account is already funded
  const accountBalance = web3.utils.toBN(await web3.eth.getBalance(accountAddress));
  if (accountBalance.gte(targetBalance)) {
    return;
  }

  // run in parallel
  const getGasPricePromise = web3.eth.getGasPrice();
  const getTxCountPromise = web3.eth.getTransactionCount(coinbaseAddress);

  const [gasPrice, lastNonce] = await Promise.all([getGasPricePromise, getTxCountPromise]);

  return web3.eth.sendTransaction({
    from: coinbaseAddress,
    gasPrice,
    nonce: lastNonce,
    to: accountAddress,
    value: targetBalance.sub(accountBalance).toString(),
  });
}
