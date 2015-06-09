var python = require('python').shell;
var web3 = require('web3');

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
web3.eth.defaultAccount = web3.eth.accounts[0];

fs = require('fs');
source = fs.readFileSync('./app/contracts/simple_storage.sol').toString()
compiled_contracts = web3.eth.compile.solidity(source)

contract = compiled_contracts.SimpleStorage

example_abi = JSON.stringify(contract.info.abiDefinition)
example_binary = contract.code.slice(2)

python("from ethertdd import EvmContract", function() {})
python("example_abi = '" + example_abi + "'", function() {})
python("example_abi", function() { })
python("example_binary = '" + example_binary + "'.decode('hex')", function() {})
python("example_binary", function() { })
python("contract = EvmContract(example_abi, example_binary)", function() {})
python("contract.set(10)", function() {})

console.log("get")
python("contract.get()", function(err, data) { console.log("=>" + data)})

