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

export function isDeployed({web3, contract}) {
  if(!contract.deployedAddress) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    web3.eth.getCode(contract.deployedAddress, (err, byteCode) => {
      if(err) return reject(err);
      const deployedAddress = contract.deployedAddress.replace("0x", "").toLowerCase();
      resolve(
        byteCode === `0x${contract.runtimeBytecode}` || // case when contract has been deployed or redeployed
        byteCode === `0x73${deployedAddress}${contract.runtimeBytecode.replace("730000000000000000000000000000000000000000", "")}` || // case when library deployed already
        byteCode === `0x${contract.runtimeBytecode.replace("0000000000000000000000000000000000000000", deployedAddress)}` // case when library has been redeployed
      );
    });
  });
}
