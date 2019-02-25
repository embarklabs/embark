import Web3 from 'web3';

export async function connect() {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.enable();
    web3.eth.defaultAccount = accounts[0];
    return web3;
  } else if (window.web3) {
    return new Web3(window.web3.currentProvider);
  } else {
    throw new Error('Non-Ethereum browser detected. You should use MetaMask!');
  }
}

export function estimateGas({web3, contract, args}) {
  return new web3.eth.Contract(contract.abiDefinition)
    .deploy({data: `0x${contract.code}`, arguments: args})
    .estimateGas({from: web3.eth.defaultAccount});
}

export function deploy({web3, contract, args}) {
  return new Promise((resolve, reject) => {
    new web3.eth.Contract(contract.abiDefinition)
      .deploy({data: `0x${contract.code}`, arguments: args})
      .send({from: web3.eth.defaultAccount})
      .on('error', reject)
      .once('receipt', resolve)
      .catch(reject)
      .then(() => {});
    });
}
