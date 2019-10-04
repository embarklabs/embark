// Check out definition 97 of the yellow paper: https://ethereum.github.io/yellowpaper/paper.pdf
const MAX_CONTRACT_BYTECODE_LENGTH = 24576;

export default function checkContractSize({contract}, callback) {
  if (!contract.code) {
    return callback();
  }

  const code = (contract.code.indexOf('0x') === 0) ? contract.code.substr(2) : contract.code;
  const contractCodeLength = Buffer.from(code, 'hex').toString().length;
  if (contractCodeLength > MAX_CONTRACT_BYTECODE_LENGTH) {
    return callback(new Error(`Bytecode for ${contract.className} contract is too large. Not deploying.`));
  }
  callback();
}
