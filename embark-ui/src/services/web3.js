import Web3 from 'web3';

export const connect = () => {
  return new Promise(async (resolve,reject) => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.enable();
        web3.eth.defaultAccount = accounts[0];
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    } else if (window.web3) {
      const web3 = new Web3(window.web3.currentProvider);
      resolve(web3);
    } else {
      reject(Error('Non-Ethereum browser detected. You should use MetaMask!'));
    }
  });
}

export const estimateGas = ({web3, contract, args}) => {
  return new web3.eth.Contract(contract.abiDefinition)
    .deploy({data: `0x${contract.code}`, arguments: args})
    .estimateGas({from: web3.eth.defaultAccount});
}

export const deploy = ({web3, contract, args}) => {
  return new Promise((resolve, reject) => {
    new web3.eth.Contract(contract.abiDefinition)
      .deploy({data: `0x${contract.code}`, arguments: args})
      .send({from: web3.eth.defaultAccount})
      .on('error', reject)
      .on('receipt', resolve)
  });
}